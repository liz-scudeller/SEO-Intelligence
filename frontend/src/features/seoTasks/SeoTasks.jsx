import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SeoTaskCard from './SeoTaskCard';

export default function SeoTasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/seo-tasks');
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching SEO tasks:', err.message);
    } finally {
      setLoading(false);
    }
  };

const handleMarkAsDone = async (id) => {
  const res = await axios.patch(`http://localhost:3000/api/seo-tasks/${id}/done`);
  const updatedTask = res.data;

  setTasks(prev => prev.map(t => t._id === id ? updatedTask : t));
};

const handleMarkAsUndone = async (id) => {
  const res = await axios.patch(`http://localhost:3000/api/seo-tasks/${id}/pending`);
  const updatedTask = res.data;

  setTasks(prev => prev.map(t => t._id === id ? updatedTask : t));
};

const handleDelete = async (id) => {
  if (window.confirm('Delete this task?')) {
    await axios.delete(`http://localhost:3000/api/seo-tasks/${id}`);
    setTasks(prev => prev.filter(t => t._id !== id));
  }
};

const handleRegenerate = async (id) => {
  await axios.patch(`http://localhost:3000/api/seo-tasks/${id}/generate-prompt`);
  const res = await axios.post(`http://localhost:3000/api/seo-tasks/${id}/generate-content`);
  const updatedTask = res.data;

  setTasks(prev => prev.map(t => t._id === id ? updatedTask : t));
};


  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return task.status === 'pending';
    if (filter === 'done') return task.status === 'done';
    return true;
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">SEO Suggestions</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'pending', 'done'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`text-sm px-3 py-1 rounded transition font-medium ${
              filter === status
                ? 'bg-[#2a2b2e] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredTasks.length === 0 ? (
        <p className="text-gray-500">No tasks found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTasks.map(task => (
            <SeoTaskCard
              key={task._id}
              task={task}
              onMarkAsDone={handleMarkAsDone}
              onMarkAsUndone={handleMarkAsUndone}
              onDelete={handleDelete}
              onRegenerate={handleRegenerate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
