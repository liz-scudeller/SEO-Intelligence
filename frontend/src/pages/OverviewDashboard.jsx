import React from 'react';
import {
  Check,
  AlertCircle,
  TrendingUp,
  FileText,
  Wrench,
  Layers,
  Bug,
  Lightbulb,
  BarChart2,
  StickyNote,
  Pin,
  MapPin,
  GaugeCircle
} from 'lucide-react';

export default function OverviewDashboard() {
  const summary = {
    totalPages: 32,
    issuesDetected: 14,
    pendingSuggestions: 6,
    visits: 2340,
    score: 68
  };

  const recommendations = [
    {
      icon: <FileText className="w-4 h-4 text-red-600" />,
      text: "Missing page for Gutter Guards in Guelph",
      urgent: true,
      actionLink: '/seo-tasks'
    },
    {
      icon: <AlertCircle className="w-4 h-4 text-yellow-600" />,
      text: "Improve title for Window Cleaning in Waterloo",
      urgent: false,
      actionLink: '/seo-report'
    },
    {
      icon: <Check className="w-4 h-4 text-green-600" />,
      text: "Write blog: How to prevent ice dams in winter",
      urgent: false,
      actionLink: '/blog-ideas'
    }
  ];

  const weakCities = [
    { name: 'Waterloo', note: 'Low CTR on 6 pages', progress: 60 },
    { name: 'Hamilton', note: 'No blog posts created', progress: 30 },
    { name: 'Guelph', note: 'High search demand but no service page', progress: 10 }
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto text-gray-800 animate-fade-in">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <StickyNote className="w-6 h-6 text-[#2a2b2e]" /> Website Overview
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <Layers className="mx-auto text-[#2a2b2e] mb-2" size={20} />
          <p className="text-sm text-gray-500">Pages Audited</p>
          <p className="text-2xl font-bold">{summary.totalPages}</p>
        </div>
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <Bug className="mx-auto text-red-600 mb-2" size={20} />
          <p className="text-sm text-gray-500">Technical Issues</p>
          <p className="text-2xl font-bold text-red-600">{summary.issuesDetected}</p>
        </div>
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <Lightbulb className="mx-auto text-yellow-500 mb-2" size={20} />
          <p className="text-sm text-gray-500">Pending Suggestions</p>
          <p className="text-2xl font-bold text-yellow-600">{summary.pendingSuggestions}</p>
        </div>
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <BarChart2 className="mx-auto text-green-600 mb-2" size={20} />
          <p className="text-sm text-gray-500">Visits (30d)</p>
          <p className="text-2xl font-bold text-green-600">{summary.visits}</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-xl p-6 mb-10">
        <p className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Pin className="w-5 h-5 text-[#2a2b2e]" /> Main Recommendations
        </p>
        <ul className="space-y-3">
          {recommendations.map((rec, idx) => (
            <li key={idx} className={`flex items-center justify-between gap-4 p-3 rounded border ${rec.urgent ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                {rec.icon}
                <span className={rec.urgent ? 'text-red-700 font-medium' : ''}>{rec.text}</span>
              </div>
              <a href={rec.actionLink} className="bg-[#2a2b2e] text-white px-3 py-1 text-xs rounded flex items-center gap-1 hover:bg-[#1e1f21]">
                <Wrench className="w-4 h-4" /> Resolve
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white shadow rounded-xl p-6 mb-10">
        <p className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#2a2b2e]" /> City Progress
        </p>
        <ul className="space-y-4">
          {weakCities.map((city, idx) => (
            <li key={idx}>
              <div className="flex justify-between items-center mb-1">
                <div>
                  <p className="font-medium">{city.name}</p>
                  <p className="text-sm text-gray-500">{city.note}</p>
                </div>
                <span className="text-sm text-gray-600">{city.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-[#759b2c]"
                  style={{ width: `${city.progress}%` }}
                ></div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white shadow rounded-xl p-6">
        <p className="text-lg font-semibold mb-4 flex items-center gap-2">
          <GaugeCircle className="w-5 h-5 text-[#2a2b2e]" /> AI Visibility Score
        </p>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full ${
              summary.score >= 80 ? 'bg-green-500' : summary.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${summary.score}%` }}
          ></div>
        </div>
        <p className="text-sm mt-2 text-gray-600">Current score: {summary.score}/100</p>
      </div>
    </div>
  );
}
