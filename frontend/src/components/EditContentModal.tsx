'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export interface SaveData {
    title: string;
    description?: string;
    category?: string;
    thumbnail?: string;
    tags?: string[];
    orderIndex?: number;
}

interface EditContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: SaveData) => Promise<void>;
    type: 'course' | 'module' | 'lesson';
    initialData: SaveData;
}

export default function EditContentModal({ isOpen, onClose, onSave, type, initialData }: EditContentModalProps) {
    const [title, setTitle] = useState(initialData.title);
    const [description, setDescription] = useState(initialData.description || '');
    const [category, setCategory] = useState(initialData.category || '');
    const [thumbnail, setThumbnail] = useState(initialData.thumbnail || '');
    const [tags, setTags] = useState<string[]>(initialData.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle(initialData.title);
            setDescription(initialData.description || '');
            setCategory(initialData.category || '');
            setThumbnail(initialData.thumbnail || '');
            setTags(initialData.tags || []);
            setTagInput('');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data: SaveData = { title };
            if (type !== 'module') data.description = description;
            if (type === 'course') {
                data.category = category;
                data.thumbnail = thumbnail;
                data.tags = tags;
            }

            await onSave(data);
            onClose();
        } catch (error) {
            console.error('Failed to save:', error);
            toast.error('Failed to save changes');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const trimmed = tagInput.trim();
            if (trimmed && !tags.includes(trimmed)) {
                setTags([...tags, trimmed]);
                setTagInput('');
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl glass-card">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Edit {type.charAt(0).toUpperCase() + type.slice(1)}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                required
                            />
                        </div>

                        {type === 'course' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Thumbnail URL</label>
                                    <input
                                        type="text"
                                        value={thumbnail}
                                        onChange={(e) => setThumbnail(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Tags</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {tags.map(tag => (
                                            <span key={tag} className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-sm flex items-center gap-1">
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    className="hover:text-white"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        placeholder="Type and press Enter to add tag"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    />
                                </div>
                            </>
                        )}

                        {type !== 'module' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
