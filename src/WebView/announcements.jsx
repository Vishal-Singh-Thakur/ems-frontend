import React, { useEffect, useState } from "react";
import { Megaphone, Plus, Trash2, X, AlertTriangle, Info, AlertCircle, Heart, MessageCircle, Send, CornerDownRight, Pencil, ImagePlus } from "lucide-react";
import { BASE_URL } from "../components/Constant/Api/Api";

// Backend serves /uploads via origin (BASE_URL includes /api — strip it)
const FILE_BASE = (BASE_URL || "").replace(/\/api\/?$/, "");
const fileUrl = (p) => (p && p.startsWith("/") ? `${FILE_BASE}${p}` : p || "");
import ApiHit from "../Utils/ApiHit";
import EmojiPicker from "../components/EmojiPicker";
import {
  GetAnnouncementsAPI,
  CreateAnnouncementAPI,
  UpdateAnnouncementAPI,
  DeleteAnnouncementAPI,
  LikeAnnouncementAPI,
  AddCommentAPI,
  EditCommentAPI,
  DeleteCommentAPI,
  LikeCommentAPI
} from "../components/Constant/Api/Api";

const PRIORITY_STYLE = {
  Normal: { badge: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300', icon: <Info size={14} />, border: 'border-l-blue-400' },
  Important: { badge: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300', icon: <AlertCircle size={14} />, border: 'border-l-amber-400' },
  Urgent: { badge: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300', icon: <AlertTriangle size={14} />, border: 'border-l-red-500' }
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const initialsOf = (name) => (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

// One announcement card with like/comment
const AnnouncementCard = ({ a, currentUserId, canPost, onChanged, onDelete, onEdit }) => {
  // Comment inline edit
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const style = PRIORITY_STYLE[a.priority] || PRIORITY_STYLE.Normal;
  const commentsCount = a.comments?.length || 0;
  const isLiked = (a.likes || []).some((l) => String(l.userId) === String(currentUserId));
  const likesCount = (a.likes || []).length;

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [likingBusy, setLikingBusy] = useState(false);
  const [commentBusy, setCommentBusy] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // { commentId, userName }
  const [replyText, setReplyText] = useState('');
  const [replyBusy, setReplyBusy] = useState(false);

  const toggleLike = async () => {
    if (likingBusy) return;
    setLikingBusy(true);
    try {
      const r = await ApiHit(LikeAnnouncementAPI(a._id), "POST");
      if (r?.success) onChanged();
    } finally {
      setLikingBusy(false);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || commentBusy) return;
    setCommentBusy(true);
    try {
      const r = await ApiHit(AddCommentAPI(a._id), "POST", { text: commentText.trim() });
      if (r?.success) {
        setCommentText('');
        onChanged();
      } else {
        alert(r?.message || 'Failed to add comment');
      }
    } finally {
      setCommentBusy(false);
    }
  };

  const openReply = (comment) => {
    setReplyTo({ commentId: comment._id, userName: comment.userName });
    setReplyText(`@${comment.userName} `);
  };

  const openEditComment = (c) => {
    setEditingCommentId(c._id);
    setEditCommentText(c.text);
  };

  const submitEditComment = async (e) => {
    e.preventDefault();
    if (!editCommentText.trim()) return;
    const r = await ApiHit(EditCommentAPI(a._id, editingCommentId), 'PATCH', { text: editCommentText.trim() });
    if (r?.success) {
      setEditingCommentId(null);
      setEditCommentText('');
      onChanged();
    } else {
      alert(r?.message || 'Failed to update comment');
    }
  };

  const submitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || replyBusy || !replyTo) return;
    setReplyBusy(true);
    try {
      const r = await ApiHit(AddCommentAPI(a._id), "POST", {
        text: replyText.trim(),
        parentCommentId: replyTo.commentId
      });
      if (r?.success) {
        setReplyText('');
        setReplyTo(null);
        onChanged();
      } else {
        alert(r?.message || 'Failed to reply');
      }
    } finally {
      setReplyBusy(false);
    }
  };

  const removeComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    const r = await ApiHit(DeleteCommentAPI(a._id, commentId), "DELETE");
    if (r?.success) onChanged();
    else alert(r?.message || 'Failed to delete');
  };

  const toggleCommentLike = async (commentId) => {
    const r = await ApiHit(LikeCommentAPI(a._id, commentId), "POST");
    if (r?.success) onChanged();
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-800 border-l-4 ${style.border} overflow-hidden`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 break-all">{a.title}</h3>
              {a.priority && a.priority !== 'Normal' && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${style.badge}`}>
                  {style.icon} {a.priority}
                </span>
              )}
              {a.audience && a.audience !== 'All' && (
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-700/50 text-gray-600 dark:text-slate-300">
                  For {a.audience}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed break-words">{a.message}</p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-400 dark:text-slate-500">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-[9px] font-bold">
                {initialsOf(a.createdBy?.name)}
              </div>
              <span>Posted by <span className="font-medium text-gray-600 dark:text-slate-300">{a.createdBy?.name || 'HR'}</span></span>
              <span>•</span>
              <span>{timeAgo(a.createdAt)}</span>
            </div>
          </div>
          {canPost && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onEdit?.(a)}
                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg"
                title="Edit announcement"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => onDelete(a._id, a.title)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                title="Delete announcement"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Image (full card width) */}
        {a.image && (
          <div className="mt-3 bg-gray-50 dark:bg-slate-900/40 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
            <img
              src={fileUrl(a.image)}
              alt="Announcement attachment"
              className="max-w-full h-auto max-h-[520px] object-contain"
            />
          </div>
        )}

        {/* Like + comment bar */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center gap-4">
          <button
            onClick={toggleLike}
            disabled={likingBusy}
            className={`flex items-center gap-1.5 text-sm font-medium transition ${
              isLiked ? 'text-red-500' : 'text-gray-500 dark:text-slate-400 hover:text-red-500'
            } disabled:opacity-50`}
          >
            <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{likesCount}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            <MessageCircle size={16} />
            <span>{commentsCount}</span>
          </button>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="bg-gray-50 dark:bg-slate-900/40 border-t border-gray-100 dark:border-slate-800 p-5 space-y-3">
          {commentsCount === 0 ? (
            <div className="text-xs text-gray-400 dark:text-slate-500 text-center py-2">No comments yet. Be the first!</div>
          ) : (() => {
              const topLevel = (a.comments || []).filter((c) => !c.parentCommentId);
              const repliesByParent = {};
              (a.comments || []).forEach((c) => {
                if (c.parentCommentId) {
                  const key = String(c.parentCommentId);
                  (repliesByParent[key] = repliesByParent[key] || []).push(c);
                }
              });

              const renderComment = (c, isReply = false) => {
                const isMine = String(c.userId) === String(currentUserId);
                const canDeleteComment = isMine || canPost;
                const canEditComment = isMine || canPost;
                const cLikes = c.likes || [];
                const isEditingThis = editingCommentId === c._id;
                return (
                  <div key={c._id} className="flex gap-3 items-start">
                    <div className={`${isReply ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-[10px]'} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0`}>
                      {initialsOf(c.userName)}
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold text-gray-800 dark:text-slate-100">{c.userName}</span>
                          <span className="text-[10px] text-gray-400 dark:text-slate-500">{timeAgo(c.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {canEditComment && !isEditingThis && (
                            <button
                              onClick={() => openEditComment(c)}
                              className="text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                              title="Edit comment"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                          {canDeleteComment && (
                            <button
                              onClick={() => removeComment(c._id)}
                              className="text-gray-400 dark:text-slate-500 hover:text-red-500"
                              title="Delete comment"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      {isEditingThis ? (
                        <form onSubmit={submitEditComment} className="mt-1 space-y-2">
                          <textarea
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            rows={2}
                            maxLength={500}
                            autoFocus
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setEditingCommentId(null)} className="text-[11px] text-gray-500 dark:text-slate-400 hover:underline">Cancel</button>
                            <button type="submit" disabled={!editCommentText.trim()} className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full font-medium disabled:opacity-50">Save</button>
                          </div>
                        </form>
                      ) : (
                        <p className="text-sm text-gray-700 dark:text-slate-200 whitespace-pre-wrap">{c.text}</p>
                      )}
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        <button
                          onClick={() => toggleCommentLike(c._id)}
                          className={`flex items-center gap-1 text-[11px] font-medium transition ${
                            cLikes.some((l) => String(l.userId) === String(currentUserId))
                              ? 'text-red-500'
                              : 'text-gray-400 dark:text-slate-500 hover:text-red-500'
                          }`}
                          title="Like"
                        >
                          <Heart size={12} fill={cLikes.some((l) => String(l.userId) === String(currentUserId)) ? 'currentColor' : 'none'} />
                          <span>{cLikes.length}</span>
                        </button>
                        <button
                          onClick={() => openReply(c)}
                          className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                          title="Reply"
                        >
                          <CornerDownRight size={12} /> Reply
                        </button>
                      </div>
                    </div>
                  </div>
                );
              };

              return (
                <div className="space-y-3">
                  {topLevel.map((c) => {
                    const replies = repliesByParent[String(c._id)] || [];
                    return (
                      <div key={c._id}>
                        {renderComment(c, false)}

                        {/* Replies indented under parent */}
                        {(replies.length > 0 || replyTo?.commentId === c._id || replies.some((r) => String(r._id) === String(replyTo?.commentId))) && (
                          <div className="ml-11 mt-2 pl-3 border-l-2 border-gray-200 dark:border-slate-700 space-y-2">
                            {replies.map((r) => renderComment(r, true))}

                            {/* Inline reply input — shown when replying to parent OR any reply in this thread */}
                            {(replyTo?.commentId === c._id || replies.some((r) => String(r._id) === String(replyTo?.commentId))) && (
                              <form onSubmit={submitReply} className="flex gap-2 pt-1 items-center">
                                <div className="flex-1 flex items-center border border-gray-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-800 pr-1 focus-within:ring-2 focus-within:ring-blue-500">
                                  <input
                                    autoFocus
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder={`Reply to ${replyTo.userName}...`}
                                    maxLength={500}
                                    className="flex-1 rounded-l-full px-3 py-1.5 text-xs bg-transparent focus:outline-none"
                                  />
                                  <EmojiPicker
                                    align="right"
                                    direction="up"
                                    onPick={(e) => setReplyText(replyText + e)}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => { setReplyTo(null); setReplyText(''); }}
                                  className="text-[11px] text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={!replyText.trim() || replyBusy}
                                  className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-full text-xs font-medium"
                                >
                                  <Send size={12} />
                                  Reply
                                </button>
                              </form>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

          {/* Comment input */}
          <form onSubmit={submitComment} className="flex gap-2 pt-2 items-center">
            <div className="flex-1 flex items-center border border-gray-200 dark:border-slate-700 rounded-full bg-white dark:bg-slate-800 pr-1 focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                maxLength={500}
                className="flex-1 rounded-l-full px-4 py-2 text-sm bg-transparent focus:outline-none"
              />
              <EmojiPicker
                align="right"
                direction="up"
                onPick={(e) => setCommentText(commentText + e)}
              />
            </div>
            <button
              type="submit"
              disabled={!commentText.trim() || commentBusy}
              className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-full text-sm font-medium"
            >
              <Send size={14} />
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const Announcements = ({ user }) => {
  const role = (user?.roleId?.name || user?.role || '').toLowerCase();
  const canPost = role === 'hr' || role === 'superadmin';
  const currentUserId = user?._id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // if set, modal is in edit mode
  const [form, setForm] = useState({ title: '', message: '', priority: 'Normal', audience: 'All' });
  const [imageFile, setImageFile] = useState(null);      // File to upload (new selection)
  const [imagePreview, setImagePreview] = useState('');  // dataURL for preview OR existing image URL
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ title: '', message: '', priority: 'Normal', audience: 'All' });
    setImageFile(null);
    setImagePreview('');
    setRemoveExistingImage(false);
    setErrors([]);
    setShowModal(true);
  };

  const openEditModal = (a) => {
    setEditingId(a._id);
    setForm({ title: a.title, message: a.message, priority: 'Normal', audience: a.audience });
    setImageFile(null);
    setImagePreview(a.image ? fileUrl(a.image) : '');
    setRemoveExistingImage(false);
    setErrors([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setImageFile(null);
    setImagePreview('');
    setRemoveExistingImage(false);
    setErrors([]);
  };

  const onPickImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\//i.test(f.type)) {
      alert('Please choose an image file');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      alert('Image must be under 5 MB');
      return;
    }
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
    setRemoveExistingImage(false);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    setRemoveExistingImage(true);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const r = await ApiHit(GetAnnouncementsAPI, "GET");
      if (r?.success) setItems(r.data?.docs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      const isEdit = !!editingId;
      const url = isEdit ? UpdateAnnouncementAPI(editingId) : CreateAnnouncementAPI;
      const method = isEdit ? 'PUT' : 'POST';

      // Use FormData when we have an image (new or edit) or when clearing existing image
      const useFormData = !!imageFile || (isEdit && removeExistingImage);
      let payload;
      if (useFormData) {
        const fd = new FormData();
        fd.append('title', form.title);
        fd.append('message', form.message);
        fd.append('priority', form.priority);
        fd.append('audience', form.audience);
        if (imageFile) fd.append('image', imageFile);
        if (isEdit && removeExistingImage) fd.append('removeImage', 'true');
        payload = fd;
      } else {
        payload = form;
      }

      const r = await ApiHit(url, method, payload);
      if (r?.success) {
        closeModal();
        fetchAll();
      } else {
        setErrors(r?.errors || [{ message: r?.message || (isEdit ? 'Failed to update' : 'Failed to post') }]);
      }
    } catch (err) {
      setErrors([{ message: err.message || 'Network error' }]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete announcement "${title}"?`)) return;
    const r = await ApiHit(DeleteAnnouncementAPI(id), "DELETE");
    if (r?.success) fetchAll();
    else alert(r?.message || 'Failed to delete');
  };

  return (
    <main className="p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-900/40 min-h-screen">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Megaphone className="text-blue-600 dark:text-blue-400" /> Announcements
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {canPost ? 'Post company-wide updates. Everyone can like & comment.' : 'Company updates from HR. Like & comment to engage.'}
          </p>
        </div>
        {canPost && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg shadow font-medium"
          >
            <Plus size={18} /> New Announcement
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">Loading announcements…</div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow border border-gray-100 dark:border-slate-800 text-center">
          <Megaphone size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <div className="text-gray-500 dark:text-slate-400 font-medium">No announcements yet</div>
          {canPost && <div className="text-xs text-gray-400 dark:text-slate-500 mt-2">Click "New Announcement" to post the first one.</div>}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Latest — full width */}
          <div>
            <div className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">Latest</div>
            <AnnouncementCard
              key={items[0]._id}
              a={items[0]}
              currentUserId={currentUserId}
              canPost={canPost}
              onChanged={fetchAll}
              onDelete={handleDelete}
              onEdit={openEditModal}
            />
          </div>

          {/* Older — 2-column grid */}
          {items.length > 1 && (
            <div>
              <div className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">Earlier Announcements</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.slice(1).map((a) => (
                  <AnnouncementCard
                    key={a._id}
                    a={a}
                    currentUserId={currentUserId}
                    canPost={canPost}
                    onChanged={fetchAll}
                    onDelete={handleDelete}
                    onEdit={openEditModal}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && canPost && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                <Megaphone size={18} className="text-blue-600 dark:text-blue-400" /> {editingId ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 text-sm p-3 rounded-lg">
                  {errors.map((e, i) => <div key={i}>• {e.field ? `${e.field}: ` : ''}{e.message}</div>)}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Title *</label>
                <div className="flex items-center border border-gray-300 dark:border-slate-600 rounded-lg pr-1 focus-within:ring-2 focus-within:ring-blue-500">
                  <input
                    type="text"
                    required
                    maxLength={150}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="flex-1 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none"
                    placeholder="E.g., Diwali Holiday Notice"
                  />
                  <EmojiPicker
                    align="right"
                    onPick={(e) => setForm({ ...form, title: form.title + e })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Message *</label>
                <div className="border border-gray-300 dark:border-slate-600 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
                  <textarea
                    required
                    rows={5}
                    maxLength={2000}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-t-lg px-3 py-2 text-sm bg-transparent focus:outline-none resize-none"
                    placeholder="Detailed message for everyone..."
                  />
                  <div className="flex items-center justify-between px-2 py-1 border-t border-gray-100 dark:border-slate-800">
                    <EmojiPicker
                      onPick={(e) => setForm({ ...form, message: form.message + e })}
                    />
                    <div className="text-[11px] text-gray-400 dark:text-slate-500">{form.message.length}/2000</div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Image (optional)</label>
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="preview" className="max-h-40 rounded-lg border border-gray-200 dark:border-slate-700" />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow"
                      title="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-500/10 rounded-lg px-4 py-3 text-sm text-gray-600 dark:text-slate-300 transition">
                    <ImagePlus size={18} className="text-blue-600 dark:text-blue-400" />
                    <span>Click to add image (JPG, PNG, GIF, WEBP — max 5 MB)</span>
                    <input type="file" accept="image/*" onChange={onPickImage} className="hidden" />
                  </label>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Audience</label>
                <select
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="All">All (everyone)</option>
                  <option value="Managers">Managers only</option>
                  <option value="Employees">Employees only</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
                >
                  {submitting
                    ? (editingId ? 'Updating…' : 'Posting…')
                    : (editingId ? 'Update Announcement' : 'Post Announcement')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Announcements;
