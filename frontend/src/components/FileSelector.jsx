import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import '../styles/FileSelector.css';

export function FileSelector({ files, selectedFiles, onSelectionChange, onConfirm, onCancel }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  // Build a tree structure from flat file list
  const fileTree = useMemo(() => {
    const tree = {};

    files.forEach(file => {
      const parts = file.path.split('/');
      let current = tree;

      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            isFile: index === parts.length - 1,
            children: {},
            size: index === parts.length - 1 ? file.size : 0
          };
        }
        current = current[part].children;
      });
    });

    return tree;
  }, [files]);

  // Filter files based on search term
  const filteredFiles = useMemo(() => {
    if (!searchTerm) return files;
    const lowerSearch = searchTerm.toLowerCase();
    return files.filter(file => file.path.toLowerCase().includes(lowerSearch));
  }, [files, searchTerm]);

  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const toggleFile = (filePath) => {
    onSelectionChange(prev => {
      if (prev.includes(filePath)) {
        return prev.filter(p => p !== filePath);
      } else {
        return [...prev, filePath];
      }
    });
  };

  const selectAll = () => {
    onSelectionChange(filteredFiles.map(f => f.path));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const renderTree = (node, level = 0) => {
    return Object.values(node).map(item => {
      if (item.isFile) {
        const isSelected = selectedFiles.includes(item.path);
        const isVisible = !searchTerm || item.path.toLowerCase().includes(searchTerm.toLowerCase());

        if (!isVisible) return null;

        return (
          <div
            key={item.path}
            className={`file-item ${isSelected ? 'selected' : ''}`}
            style={{ paddingLeft: `${level * 20 + 10}px` }}
            onClick={() => toggleFile(item.path)}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleFile(item.path)}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="file-icon">📄</span>
            <span className="file-name">{item.name}</span>
            <span className="file-size">{formatSize(item.size)}</span>
          </div>
        );
      } else {
        const isExpanded = expandedFolders.has(item.path);
        const hasVisibleChildren = searchTerm ?
          Object.values(item.children).some(child =>
            child.isFile && child.path.toLowerCase().includes(searchTerm.toLowerCase())
          ) : true;

        if (!hasVisibleChildren && searchTerm) return null;

        return (
          <div key={item.path} className="folder-item">
            <div
              className="folder-header"
              style={{ paddingLeft: `${level * 20 + 10}px` }}
              onClick={() => toggleFolder(item.path)}
            >
              <span className="folder-icon">{isExpanded ? '📂' : '📁'}</span>
              <span className="folder-name">{item.name}</span>
            </div>
            {(isExpanded || searchTerm) && (
              <div className="folder-children">
                {renderTree(item.children, level + 1)}
              </div>
            )}
          </div>
        );
      }
    });
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="file-selector-overlay">
      <div className="file-selector-modal">
        <div className="file-selector-header">
          <h2>Select Files to Analyze</h2>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>

        <div className="file-selector-toolbar">
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="selection-actions">
            <button onClick={selectAll} className="action-button">Select All</button>
            <button onClick={clearAll} className="action-button">Clear All</button>
            <span className="selection-count">
              {selectedFiles.length} selected
            </span>
          </div>
        </div>

        <div className="file-tree">
          {renderTree(fileTree)}
        </div>

        <div className="file-selector-footer">
          <button onClick={onCancel} className="cancel-button">Cancel</button>
          <button
            onClick={onConfirm}
            className="confirm-button"
            disabled={selectedFiles.length === 0}
          >
            Analyze {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

FileSelector.propTypes = {
  files: PropTypes.arrayOf(PropTypes.shape({
    path: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired
  })).isRequired,
  selectedFiles: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelectionChange: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};
