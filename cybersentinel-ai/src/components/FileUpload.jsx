import React, { useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import './FileUpload.css';

export default function FileUpload({ onFileSelect, selectedFile, onClear }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) onFileSelect(file);
  };

  return (
    <div className="file-upload-wrapper">
      {!selectedFile ? (
        <div
          className={`file-drop-zone ${dragging ? 'file-drop-zone--dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
        >
          <div className="drop-icon">
            <Upload size={30} />
          </div>
          <p className="drop-title">Upload Network Traffic CSV</p>
          <p className="drop-sub">Drag &amp; drop your file here, or <span className="drop-link">click to browse</span></p>
          <p className="drop-hint">Supports .csv files only</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleChange}
          />
        </div>
      ) : (
        <div className="file-selected">
          <div className="file-selected-icon">
            <FileText size={22} />
          </div>
          <div className="file-selected-info">
            <span className="file-selected-name">{selectedFile.name}</span>
            <span className="file-selected-size">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </span>
          </div>
          <button className="file-clear-btn" onClick={onClear} title="Remove file">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
