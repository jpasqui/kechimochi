import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JitenImporter } from '../../src/importers/jiten';
import { invoke } from '@tauri-apps/api/core';

describe('JitenImporter', () => {
    let importer: JitenImporter;

    beforeEach(() => {
        importer = new JitenImporter();
        vi.clearAllMocks();
    });

    describe('matchUrl', () => {
        it('should match valid Jiten URLs', () => {
            expect(importer.matchUrl('https://jiten.moe/decks/123')).toBe(true);
        });

    });

    describe('fetch', () => {
        it('should fetch and parse Jiten deck data correctly', async () => {
            const mockData = {
                data: {
                    mainDeck: {
                        deckId: 123,
                        originalTitle: 'タイトル',
                        description: 'Desc',
                        characterCount: 1000,
                        difficultyRaw: 3.5,
                        mediaType: 4 // Novel
                    }
                }
            };

            vi.mocked(invoke).mockResolvedValue(JSON.stringify(mockData));

            const result = await importer.fetch('https://jiten.moe/decks/123');

            expect(result.title).toBe('タイトル');
            expect(result.description).toBe('Desc');
            expect(result.coverImageUrl).toContain('cdn.jiten.moe/123/cover.jpg');
            expect(result.extraData['Character count']).toBe('1,000');
            expect(result.extraData['Jiten difficulty']).toBe('3.50/5');
            expect(result.contentType).toBe('Novel');
        });

        it('should prefer child fields and fall back to entire series fields when needed', async () => {
            const childDeck = {
                data: {
                    mainDeck: {
                        deckId: 456,
                        parentDeckId: 123,
                        originalTitle: 'Volume 1',
                        description: '',
                        characterCount: 1000,
                        wordCount: null,
                        uniqueKanjiCount: 220,
                        difficultyRaw: -1,
                        mediaType: 4,
                        coverName: null,
                    }
                }
            };
            const parentDeck = {
                data: {
                    mainDeck: {
                        deckId: 123,
                        originalTitle: 'Series',
                        description: 'Series Desc',
                        characterCount: 9999,
                        wordCount: 6000,
                        uniqueKanjiCount: 800,
                        difficultyRaw: 2.5,
                        mediaType: 4,
                        coverName: 'cover.jpg',
                    }
                }
            };

            vi.mocked(invoke)
                .mockResolvedValueOnce(JSON.stringify(childDeck))
                .mockResolvedValueOnce(JSON.stringify(parentDeck));

            const result = await importer.fetch('https://jiten.moe/decks/456');

            expect(result.description).toBe('Series Desc');
            expect(result.coverImageUrl).toBe('https://cdn.jiten.moe/123/cover.jpg');
            expect(result.extraData['Character count']).toBe('1,000');
            expect(result.extraData['Word count']).toBe('6,000');
            expect(result.extraData['Unique kanji']).toBe('220');
            expect(result.extraData['Jiten difficulty']).toBe('2.50/5');
            expect(result.fieldSources).toEqual({
                description: 'entireSeries',
                coverImageUrl: 'entireSeries',
                extraData: {
                    'Word count': 'entireSeries',
                    'Jiten difficulty': 'entireSeries',
                },
            });
        });

        it('should still use the entire series cover for child decks even when the child exposes coverName', async () => {
            const childDeck = {
                data: {
                    mainDeck: {
                        deckId: 456,
                        parentDeckId: 123,
                        originalTitle: 'Volume 1',
                        description: 'Volume Desc',
                        characterCount: 1000,
                        difficultyRaw: 2,
                        mediaType: 4,
                        coverName: 'volume-cover.jpg',
                    }
                }
            };
            const parentDeck = {
                data: {
                    mainDeck: {
                        deckId: 123,
                        originalTitle: 'Series',
                        description: 'Series Desc',
                        mediaType: 4,
                        coverName: 'series-cover.jpg',
                    }
                }
            };

            vi.mocked(invoke)
                .mockResolvedValueOnce(JSON.stringify(childDeck))
                .mockResolvedValueOnce(JSON.stringify(parentDeck));

            const result = await importer.fetch('https://jiten.moe/decks/456');

            expect(result.coverImageUrl).toBe('https://cdn.jiten.moe/123/cover.jpg');
            expect(result.fieldSources?.coverImageUrl).toBe('entireSeries');
        });

        it('should throw error on invalid URL', async () => {
            await expect(importer.fetch('https://jiten.moe/invalid')).rejects.toThrow('Invalid Jiten.moe URL');
        });
    });
});
