'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  useGetAllPostsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  BlogPost,
  BlogPostInput,
} from '@/features/blog/api/blogApi';
import {
  FileText,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Eye,
  X,
  Clock,
} from 'lucide-react';

const EMPTY_FORM: BlogPostInput = {
  title: '',
  excerpt: '',
  content: '',
  category: 'Product',
  authorName: 'BitCommerce Team',
  status: 'DRAFT',
};

export default function AdminBlogPage() {
  const { data: posts = [], isLoading } = useGetAllPostsQuery();
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();
  const [deletePost] = useDeletePostMutation();

  const [isEditorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<BlogPostInput>(EMPTY_FORM);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);

  const isSaving = isCreating || isUpdating;

  const openCreate = () => {
    setEditingPost(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      authorName: post.authorName,
      status: post.status,
    });
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required.');
      return;
    }

    try {
      if (editingPost) {
        await updatePost({ id: editingPost.id, body: form }).unwrap();
        toast.success('Post updated.');
      } else {
        await createPost(form).unwrap();
        toast.success('Post created.');
      }
      setEditorOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Could not save the post.');
    }
  };

  const handleDelete = async () => {
    if (!postToDelete) return;
    try {
      await deletePost(postToDelete.id).unwrap();
      toast.success('Post deleted.');
      setPostToDelete(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Could not delete the post.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Blog</h1>
            <p className="text-xs text-slate-500">
              Write and publish posts for the public marketing blog.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/blog"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View blog</span>
          </a>
          <button
            onClick={openCreate}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New post</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl">
          <p className="text-sm font-bold text-slate-700">No posts yet</p>
          <p className="text-xs text-slate-500 mt-1">Create your first post to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100">
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                      post.status === 'PUBLISHED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {post.status}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{post.category}</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readingMinutes} min
                  </span>
                </div>
                <h3 className="mt-1.5 text-sm font-extrabold text-slate-900 truncate">
                  {post.title}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono truncate">/blog/{post.slug}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openEdit(post)}
                  className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setPostToDelete(post)}
                  aria-label={`Delete ${post.title}`}
                  className="p-2 bg-white border border-slate-200 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      {isEditorOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="editor-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="editor-title" className="text-lg font-extrabold text-slate-900">
                {editingPost ? 'Edit post' : 'New post'}
              </h2>
              <button
                onClick={() => setEditorOpen(false)}
                aria-label="Close editor"
                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="post-title" className="text-[11px] font-bold text-slate-600 block mb-1">
                  Title
                </label>
                <input
                  id="post-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="How to grow your store"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {!editingPost && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    The URL is generated from the title.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="post-category" className="text-[11px] font-bold text-slate-600 block mb-1">
                    Category
                  </label>
                  <input
                    id="post-category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="post-author" className="text-[11px] font-bold text-slate-600 block mb-1">
                    Author
                  </label>
                  <input
                    id="post-author"
                    value={form.authorName}
                    onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="post-excerpt" className="text-[11px] font-bold text-slate-600 block mb-1">
                  Excerpt
                </label>
                <textarea
                  id="post-excerpt"
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  rows={2}
                  placeholder="One or two sentences shown on the blog index."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>

              <div>
                <label htmlFor="post-content" className="text-[11px] font-bold text-slate-600 block mb-1">
                  Content
                </label>
                <textarea
                  id="post-content"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={12}
                  placeholder="Write the post. Separate paragraphs with a blank line."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
                />
              </div>

              <div>
                <label htmlFor="post-status" className="text-[11px] font-bold text-slate-600 block mb-1">
                  Status
                </label>
                <select
                  id="post-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as BlogPostInput['status'] })
                  }
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DRAFT">Draft — not visible publicly</option>
                  <option value="PUBLISHED">Published — live on the blog</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditorOpen(false)}
                disabled={isSaving}
                className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingPost ? 'Save changes' : 'Create post'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {postToDelete && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">Delete this post?</h2>
            <p className="text-xs text-slate-600">
              &ldquo;{postToDelete.title}&rdquo; will be removed permanently. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPostToDelete(null)}
                className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition-colors"
              >
                Keep post
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
