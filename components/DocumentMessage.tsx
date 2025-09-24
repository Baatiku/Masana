import React, { useState, useRef, ReactNode, useMemo } from 'react';
import { ChatMessage, Persona } from '../types';
import { FileDownIcon, XIcon, GlobeIcon, ChevronDownIcon } from './icons/Icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PersonaAvatar from './PersonaAvatar';

interface DocumentMessageProps {
    message: ChatMessage;
    persona: Persona;
}

const inlineRender = (text: string): ReactNode[] => {
    const parts = text.split(/(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|`.*?`)/g);
    return parts.map((part, index) => {
        if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
            return <em key={index}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={index} className="bg-gray-200 dark:bg-gray-700 text-pink-600 dark:text-pink-400 rounded px-1 py-0.5 text-sm font-mono">{part.slice(1, -1)}</code>;
        }
        return part;
    });
};

const renderMarkdownToJsx = (markdown: string = ""): ReactNode[] => {
    const lines = markdown.split('\n');
    const elements: ReactNode[] = [];
    let listItems: ReactNode[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(<ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-2 pl-4">{listItems}</ul>);
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        if (line.startsWith('# ')) {
            flushList();
            elements.push(<h1 key={index} className="text-3xl font-bold my-4 pb-2 border-b border-gray-300 dark:border-gray-600">{line.substring(2)}</h1>);
            return;
        }
        if (line.startsWith('## ')) {
            flushList();
            elements.push(<h2 key={index} className="text-2xl font-bold my-3 pb-1 border-b border-gray-300 dark:border-gray-600">{line.substring(3)}</h2>);
            return;
        }
        if (line.startsWith('### ')) {
            flushList();
            elements.push(<h3 key={index} className="text-xl font-bold my-2">{line.substring(4)}</h3>);
            return;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
            listItems.push(<li key={index}>{inlineRender(line.substring(2))}</li>);
            return;
        }

        flushList();
        if (line.trim() !== '') {
            elements.push(<p key={index} className="my-2 leading-relaxed">{inlineRender(line)}</p>);
        } else if (elements.length > 0 && lines[index-1]?.trim() !== '') {
             elements.push(<br key={`br-${index}`} />);
        }
    });

    flushList();
    return elements;
};


const DocumentMessage: React.FC<DocumentMessageProps> = ({ message, persona }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
    const documentContentRef = useRef<HTMLDivElement>(null);

    const title = message.metadata?.title || 'Document';
    const content = message.metadata?.content || '';

    const validSources = useMemo(() => {
        return (message.metadata?.groundingChunks || []).filter(chunk => chunk.web && chunk.web.uri);
    }, [message.metadata?.groundingChunks]);

    const handleExportPDF = async () => {
        const contentEl = documentContentRef.current;
        if (!contentEl) return;
        
        const isDarkMode = document.documentElement.classList.contains('dark');
        if(isDarkMode) document.documentElement.classList.remove('dark');
        
        try {
            const canvas = await html2canvas(contentEl, { 
                scale: 2, 
                backgroundColor: '#FFFFFF',
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            let imgWidth = pdfWidth - 20;
            let imgHeight = imgWidth / ratio;
            let heightLeft = imgHeight;
            let position = 10;
            
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 20);

            while (heightLeft > 0) {
                position = heightLeft - imgHeight + 10;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= (pdfHeight - 20);
            }

            pdf.save(`${title.replace(/ /g, '_')}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            if(isDarkMode) document.documentElement.classList.add('dark');
        }
    };
    
    const handleExportDOC = () => {
        const contentEl = documentContentRef.current;
        if (!contentEl) return;
        
        const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${title}</title></head><body>`;
        const footer = "</body></html>";
        const sourceHTML = header + contentEl.innerHTML + footer;
        
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = `${title.replace(/ /g, '_')}.doc`;
        fileDownload.click();
        document.body.removeChild(fileDownload);
    };

    const renderedContent = renderMarkdownToJsx(content);

    return (
        <>
            <div className="flex items-end gap-3 justify-start">
                <PersonaAvatar persona={persona} className="w-8 h-8 flex-shrink-0" />
                <div 
                    className="w-full max-w-md bg-white dark:bg-gray-700 rounded-r-2xl rounded-tl-2xl rounded-bl-md p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
                    onClick={() => setIsModalOpen(true)}
                >
                    <div className="flex items-start space-x-3">
                        <FileDownIcon className="w-8 h-8 text-green-500 dark:text-green-400 flex-shrink-0 mt-1" />
                        <div className="flex-grow min-w-0">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{content.substring(0, 100)}...</p>
                             {validSources.length > 0 && (
                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <GlobeIcon className="w-3 h-3" />
                                    <span>Includes web sources</span>
                                </div>
                            )}
                        </div>
                    </div>
                     <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600/50">
                        <button onClick={(e) => { e.stopPropagation(); handleExportPDF(); }} className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-md transition-colors">PDF</button>
                        <button onClick={(e) => { e.stopPropagation(); handleExportDOC(); }} className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md transition-colors">DOC</button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="relative w-full max-w-4xl h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{title}</h2>
                            <div className="flex items-center space-x-4">
                                <button onClick={handleExportPDF} className="text-sm bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">Export PDF</button>
                                <button onClick={handleExportDOC} className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">Export DOC</button>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <XIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>
                        </header>
                        <main className="flex-grow overflow-y-auto">
                            <div ref={documentContentRef} className="p-8 text-gray-800 dark:text-gray-200 prose dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white">
                                {renderedContent}
                                {validSources.length > 0 && (
                                    <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-600 not-prose">
                                        <button
                                            onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                                            className="w-full flex items-center justify-between py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-left"
                                            aria-expanded={isSourcesExpanded}
                                        >
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                Sources ({validSources.length})
                                            </h3>
                                            <ChevronDownIcon className={`w-6 h-6 text-gray-600 dark:text-gray-300 transition-transform ${isSourcesExpanded ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isSourcesExpanded && (
                                            <ol className="space-y-2 mt-2">
                                                {validSources.map((chunk: any, i: number) => (
                                                    <li key={i} className="flex items-start gap-3">
                                                        <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                                                        <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 dark:text-green-400 hover:underline break-words" title={chunk.web.title}>
                                                            {chunk.web.title || chunk.web.uri}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ol>
                                        )}
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            )}
        </>
    );
};

export default DocumentMessage;