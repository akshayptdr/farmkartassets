import React from 'react';

const STATUS_STYLES = {
  available:    'bg-green-100 text-green-700',
  assigned:     'bg-blue-100 text-blue-700',
  under_repair: 'bg-yellow-100 text-yellow-700',
  retired:      'bg-gray-100 text-gray-600',
  active:       'bg-blue-100 text-blue-700',
  returned:     'bg-green-100 text-green-700',
};

const CONDITION_STYLES = {
  new:     'bg-emerald-100 text-emerald-700',
  good:    'bg-green-100 text-green-700',
  fair:    'bg-yellow-100 text-yellow-700',
  damaged: 'bg-red-100 text-red-700',
  retired: 'bg-gray-100 text-gray-600',
};

const TYPE_LABELS = {
  laptop: 'Laptop', desktop: 'Desktop', cpu: 'CPU',
  keyboard: 'Keyboard', mouse: 'Mouse', printer: 'Printer',
  mobile: 'Mobile', cctv: 'CCTV', router: 'Router',
  sim: 'SIM', barcode_scanner: 'Barcode Scanner', other: 'Other'
};

export function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
  const label = status?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—';
  return <span className={`badge ${style}`}>{label}</span>;
}

export function ConditionBadge({ condition }) {
  const style = CONDITION_STYLES[condition] || 'bg-gray-100 text-gray-600';
  const label = condition ? condition.charAt(0).toUpperCase() + condition.slice(1) : '—';
  return <span className={`badge ${style}`}>{label}</span>;
}

export function TypeBadge({ type }) {
  return <span className="badge bg-purple-100 text-purple-700">{TYPE_LABELS[type] || type}</span>;
}

export function AssetTypeIcon({ type }) {
  const icons = {
    laptop: '💻', desktop: '🖥️', cpu: '🔲',
    keyboard: '⌨️', mouse: '🖱️', printer: '🖨️',
    mobile: '📱', cctv: '📹', router: '📡',
    sim: '📶', barcode_scanner: '📊', other: '🔧'
  };
  return <span className="text-lg">{icons[type] || '📦'}</span>;
}
