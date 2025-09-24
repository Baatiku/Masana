
const calculateScore = (query: string, target: string): number => {
    const lowerQuery = query.toLowerCase();
    const lowerTarget = target.toLowerCase();

    if (!lowerQuery || !lowerTarget) return 0;

    // 1. Exact match
    if (lowerTarget === lowerQuery) {
        return 1.0;
    }

    // 2. Starts with match
    if (lowerTarget.startsWith(lowerQuery)) {
        return 0.9 + (0.1 * (lowerQuery.length / lowerTarget.length));
    }

    // 3. Includes match
    if (lowerTarget.includes(lowerQuery)) {
        return 0.8 + (0.1 * (lowerQuery.length / lowerTarget.length));
    }
    
    // 4. Word-based matching (includes)
    const queryWords = lowerQuery.split(' ').filter(Boolean);
    const targetWords = lowerTarget.split(' ').filter(Boolean);
    let wordMatchCount = 0;

    queryWords.forEach(qWord => {
        if (targetWords.some(tWord => tWord.includes(qWord))) {
            wordMatchCount++;
        }
    });

    if (queryWords.length > 0) {
        const wordMatchScore = wordMatchCount / queryWords.length;
        if (wordMatchScore > 0) return wordMatchScore * 0.7; // Max score of 0.7 for this
    }

    // 5. Basic sequential character matching (subsequence)
    let queryIndex = 0;
    let targetIndex = 0;
    let matchCount = 0;
    while (queryIndex < lowerQuery.length && targetIndex < lowerTarget.length) {
        if (lowerQuery[queryIndex] === lowerTarget[targetIndex]) {
            queryIndex++;
            matchCount++;
        }
        targetIndex++;
    }
    
    if (lowerQuery.length > 0) {
        const sequentialScore = matchCount / lowerQuery.length;
        return sequentialScore * 0.5; // Max score of 0.5 for this
    }
    
    return 0;
};

// Helper to get nested property values, handling potential undefined properties along the path.
const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};


export const fuzzySearchAndSort = <T extends object>(
    query: string, 
    items: T[], 
    keys: string[]
): T[] => {
    if (!query.trim()) {
        return items;
    }

    const scoredItems = items.map(item => {
        let highestScore = 0;
        keys.forEach(key => {
            const value = getNestedValue(item, key);
            if (typeof value === 'string') {
                const score = calculateScore(query, value);
                if (score > highestScore) {
                    highestScore = score;
                }
            } else if (Array.isArray(value)) { // for expertise[]
                value.forEach(v => {
                    if (typeof v === 'string') {
                        const score = calculateScore(query, v);
                        if (score > highestScore) {
                            highestScore = score;
                        }
                    }
                });
            }
        });
        return { item, score: highestScore };
    });

    // Filter items with a score > 0.3 (adjustable threshold) and sort by score descending
    return scoredItems
        .filter(scoredItem => scoredItem.score > 0.3)
        .sort((a, b) => b.score - a.score)
        .map(scoredItem => scoredItem.item);
};
