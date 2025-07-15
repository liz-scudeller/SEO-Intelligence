import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  CheckCircle2,
  Undo2,
  Brain,
} from 'lucide-react';

export default function SeoTaskCard({
  task,
  onMarkAsDone,
  onMarkAsUndone,
  onDelete,
  onRegenerate,
}) {
  const [loadingAction, setLoadingAction] = useState(null);

  return (
    <div className="p-4 border border-gray-100 rounded-xl shadow-sm bg-white flex flex-col justify-between hover:shadow-md transition-all h-full">
      {/* TOPO */}
      <div className="space-y-3 text-sm text-[#2a2b2e] mb-4">
        <h2 className="text-base font-semibold">{task.keyword}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          <p>
            <span className="font-medium text-[#2a2b2e]/80">Action:</span> {task.action}
          </p>
          <p>
            <span className="font-medium text-[#2a2b2e]/80">Slug:</span> /{task.slug}
          </p>
          <p>
            <span className="font-medium text-[#2a2b2e]/80">SEO Title:</span> {task.seoTitle}
          </p>
          <p>
            <span className="font-medium text-[#2a2b2e]/80">Meta Description:</span> {task.metaDescription}
          </p>
        </div>

        {task.justification && (
          <div className="bg-[#759b2c]/10 border border-[#759b2c]/20 p-3 rounded text-sm leading-snug">
            <span className="inline-flex items-center gap-1 text-[#759b2c] font-medium">
              <Brain size={14} />
              Justification
            </span>
            <p className="mt-1 text-[#2a2b2e]">{task.justification}</p>
          </div>
        )}

        {task.content && (
          <div>
            <p className="font-semibold mb-1">Content:</p>
            <div className="text-xs text-gray-800 bg-gray-50 p-2 rounded border border-gray-100 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {task.content}
            </div>
          </div>
        )}
      </div>

      {/* TAGS */}
      <div className="flex flex-wrap gap-2 text-xs mb-4">
        {typeof task.semanticScore === 'number' && (
          <span
            className={`px-2 py-1 rounded font-medium ${
              task.semanticScore >= 7
                ? 'bg-[#759b2c]/10 text-[#759b2c]'
                : task.semanticScore >= 4
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            Semantic Score: {task.semanticScore}/10
          </span>
        )}

        {'hasCallToAction' in task && (
          <span
            className={`px-2 py-1 rounded ${
              task.hasCallToAction
                ? 'text-[#759b2c] bg-[#759b2c]/10 font-medium'
                : 'text-gray-400 bg-gray-100'
            }`}
          >
            {task.hasCallToAction ? 'Has Call to Action' : 'No Call to Action'}
          </span>
        )}
      </div>

      {/* BOTÕES */}
      <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-gray-100 pt-3">
        {task.status === 'pending' ? (
          <button
            onClick={async () => {
              setLoadingAction('done');
              await onMarkAsDone(task._id);
              setLoadingAction(null);
            }}
            disabled={loadingAction === 'done'}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-[#759b2c] text-white rounded hover:bg-[#678e27] disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            {loadingAction === 'done' ? 'Marking...' : 'Mark as Done'}
          </button>
        ) : (
          <button
            onClick={async () => {
              setLoadingAction('undone');
              await onMarkAsUndone(task._id);
              setLoadingAction(null);
            }}
            disabled={loadingAction === 'undone'}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-[#2a2b2e] text-white rounded hover:bg-[#1d1e20] disabled:opacity-50"
          >
            <Undo2 size={16} />
            {loadingAction === 'undone' ? 'Unmarking...' : 'Mark as Undone'}
          </button>
        )}

        <button
          onClick={async () => {
            setLoadingAction('regenerate');
            await onRegenerate(task._id);
            setLoadingAction(null);
          }}
          disabled={loadingAction === 'regenerate'}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-[#2a2b2e] rounded hover:bg-gray-200 disabled:opacity-50"
        >
          <RotateCcw size={16} />
          {loadingAction === 'regenerate' ? 'Regenerating...' : 'Regenerate'}
        </button>

        <button
          onClick={async () => {
            setLoadingAction('delete');
            await onDelete(task._id);
            setLoadingAction(null);
          }}
          disabled={loadingAction === 'delete'}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50"
        >
          <Trash2 size={16} />
          {loadingAction === 'delete' ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
