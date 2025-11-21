import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FileProvider, useFiles } from './fileContext';

let mockAuthState = { user: null, loading: false };
const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('./AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('../services/apiClient', () => ({
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  API_BASE_URL: '',
}));

// Mock child component for provider wrapper
const wrapper = ({ children }) => <FileProvider>{children}</FileProvider>;

beforeEach(() => {
  mockAuthState = { user: null, loading: false };
  mockGet.mockReset();
  mockPost.mockReset();
  mockGet.mockResolvedValue({ data: [] });
  mockPost.mockResolvedValue({});
});

describe('FileContext - Batch Selection', () => {
  describe('toggleFileSelection', () => {
    it('should add file to selection when not selected', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      
      act(() => {
        result.current.toggleFileSelection('file-1');
      });
      
      expect(result.current.selectedFiles.has('file-1')).toBe(true);
      expect(result.current.selectedFiles.size).toBe(1);
    });

    it('should remove file from selection when already selected', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      
      act(() => {
        result.current.toggleFileSelection('file-1');
      });
      expect(result.current.selectedFiles.has('file-1')).toBe(true);
      
      act(() => {
        result.current.toggleFileSelection('file-1');
      });
      expect(result.current.selectedFiles.has('file-1')).toBe(false);
      expect(result.current.selectedFiles.size).toBe(0);
    });

    it('should handle multiple file selections', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      
      act(() => {
        result.current.toggleFileSelection('file-1');
        result.current.toggleFileSelection('file-2');
        result.current.toggleFileSelection('file-3');
      });
      
      expect(result.current.selectedFiles.size).toBe(3);
      expect(result.current.selectedFiles.has('file-1')).toBe(true);
      expect(result.current.selectedFiles.has('file-2')).toBe(true);
      expect(result.current.selectedFiles.has('file-3')).toBe(true);
    });
  });

  describe('toggleFolderSelection', () => {
    it('should add folder to selection when not selected', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      
      act(() => {
        result.current.toggleFolderSelection('folder-1');
      });
      
      expect(result.current.selectedFolders.has('folder-1')).toBe(true);
      expect(result.current.selectedFolders.size).toBe(1);
    });

    it('should remove folder from selection when already selected', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      
      act(() => {
        result.current.toggleFolderSelection('folder-1');
      });
      expect(result.current.selectedFolders.has('folder-1')).toBe(true);
      
      act(() => {
        result.current.toggleFolderSelection('folder-1');
      });
      expect(result.current.selectedFolders.has('folder-1')).toBe(false);
      expect(result.current.selectedFolders.size).toBe(0);
    });

    it('should handle multiple folder selections', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      
      act(() => {
        result.current.toggleFolderSelection('folder-1');
        result.current.toggleFolderSelection('folder-2');
      });
      
      expect(result.current.selectedFolders.size).toBe(2);
      expect(result.current.selectedFolders.has('folder-1')).toBe(true);
      expect(result.current.selectedFolders.has('folder-2')).toBe(true);
    });
  });

  describe('clearSelection', () => {
    it('should clear all selected files and folders', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      
      act(() => {
        result.current.toggleFileSelection('file-1');
        result.current.toggleFileSelection('file-2');
        result.current.toggleFolderSelection('folder-1');
      });
      
      expect(result.current.selectedFiles.size).toBe(2);
      expect(result.current.selectedFolders.size).toBe(1);
      
      act(() => {
        result.current.clearSelection();
      });
      
      expect(result.current.selectedFiles.size).toBe(0);
      expect(result.current.selectedFolders.size).toBe(0);
    });

    it('should work when selection is already empty', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      
      act(() => {
        result.current.clearSelection();
      });
      
      expect(result.current.selectedFiles.size).toBe(0);
      expect(result.current.selectedFolders.size).toBe(0);
    });
  });

  describe('selectAll', () => {
    it('should select all files and folders from items array', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      
      const items = [
        { id: 'file-1', type: 'pdf' },
        { id: 'file-2', type: 'image' },
        { id: 'folder-1', type: 'folder' },
        { id: 'folder-2', type: 'folder' }
      ];
      
      act(() => {
        result.current.selectAll(items);
      });
      
      expect(result.current.selectedFiles.size).toBe(2);
      expect(result.current.selectedFolders.size).toBe(2);
      expect(result.current.selectedFiles.has('file-1')).toBe(true);
      expect(result.current.selectedFiles.has('file-2')).toBe(true);
      expect(result.current.selectedFolders.has('folder-1')).toBe(true);
      expect(result.current.selectedFolders.has('folder-2')).toBe(true);
    });

    it('should handle empty items array', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      
      act(() => {
        result.current.selectAll([]);
      });
      
      expect(result.current.selectedFiles.size).toBe(0);
      expect(result.current.selectedFolders.size).toBe(0);
    });

    it('should handle items with only files', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      
      const items = [
        { id: 'file-1', type: 'pdf' },
        { id: 'file-2', type: 'doc' }
      ];
      
      act(() => {
        result.current.selectAll(items);
      });
      
      expect(result.current.selectedFiles.size).toBe(2);
      expect(result.current.selectedFolders.size).toBe(0);
    });

    it('should handle items with only folders', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      
      const items = [
        { id: 'folder-1', type: 'folder' },
        { id: 'folder-2', type: 'folder' }
      ];
      
      act(() => {
        result.current.selectAll(items);
      });
      
      expect(result.current.selectedFiles.size).toBe(0);
      expect(result.current.selectedFolders.size).toBe(2);
    });

    it('should ignore items without ids when selecting all', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });

      const items = [
        { id: 'file-1', type: 'pdf' },
        { type: 'pdf' },
      ];

      act(() => {
        result.current.selectAll(items);
      });

      expect(result.current.selectedFiles.size).toBe(1);
      expect(result.current.selectedFiles.has('file-1')).toBe(true);
    });
  });

  describe('isBatchMode', () => {
    it('should be false when nothing is selected', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      
      expect(result.current.isBatchMode).toBe(false);
    });

    it('should be true when files are selected', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      
      act(() => {
        result.current.toggleFileSelection('file-1');
      });
      
      expect(result.current.isBatchMode).toBe(true);
    });

    it('should be true when folders are selected', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      
      act(() => {
        result.current.toggleFolderSelection('folder-1');
      });
      
      expect(result.current.isBatchMode).toBe(true);
    });

    it('should be true when both files and folders are selected', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      
      act(() => {
        result.current.toggleFileSelection('file-1');
        result.current.toggleFolderSelection('folder-1');
      });
      
      expect(result.current.isBatchMode).toBe(true);
    });

    it('should return to false after clearing selection', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      
      act(() => {
        result.current.toggleFileSelection('file-1');
      });
      expect(result.current.isBatchMode).toBe(true);
      
      act(() => {
        result.current.clearSelection();
      });
      expect(result.current.isBatchMode).toBe(false);
    });
  });

  describe('mixed operations', () => {
    it('should handle complex selection scenarios', () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      
      // Select multiple items
      act(() => {
        result.current.toggleFileSelection('file-1');
        result.current.toggleFileSelection('file-2');
        result.current.toggleFolderSelection('folder-1');
      });
      
      expect(result.current.selectedFiles.size).toBe(2);
      expect(result.current.selectedFolders.size).toBe(1);
      expect(result.current.isBatchMode).toBe(true);
      
      // Deselect one file
      act(() => {
        result.current.toggleFileSelection('file-1');
      });
      
      expect(result.current.selectedFiles.size).toBe(1);
      expect(result.current.selectedFolders.size).toBe(1);
      expect(result.current.isBatchMode).toBe(true);
      
      // Clear all
      act(() => {
        result.current.clearSelection();
      });
      
      expect(result.current.selectedFiles.size).toBe(0);
      expect(result.current.selectedFolders.size).toBe(0);
      expect(result.current.isBatchMode).toBe(false);
    });
  });

  describe('data refresh pruning', () => {
    it('should prune selections to ids returned by fetch', async () => {
      mockAuthState = { user: { _id: 'user-1', email: 't@test.com' }, loading: false };
      // first fetch returns file-keep
      mockGet.mockImplementation((url) => {
        if (url === '/files') return Promise.resolve({ data: [{ _id: 'file-keep', filename: 'Keep', type: 'pdf' }] });
        return Promise.resolve({ data: [] });
      });

      const { result } = renderHook(() => useFiles(), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.toggleFileSelection('file-keep');
        result.current.toggleFileSelection('file-stale');
      });
      expect(result.current.selectedFiles.size).toBe(2);

      // next fetch drops stale id
      mockGet.mockImplementation((url) => {
        if (url === '/files') return Promise.resolve({ data: [{ _id: 'file-keep', filename: 'Keep', type: 'pdf' }] });
        return Promise.resolve({ data: [] });
      });

      await act(async () => {
        await result.current.refreshFiles();
      });

      expect(result.current.selectedFiles.size).toBe(1);
      expect(result.current.selectedFiles.has('file-keep')).toBe(true);
      expect(result.current.selectedFiles.has('file-stale')).toBe(false);
    });
  });

  describe('batchStar', () => {
    it('should skip when no ids provided', async () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      await act(async () => {
        await result.current.batchStar([], [], true);
      });
      expect(mockPost).not.toHaveBeenCalledWith('/batch/star', expect.anything());
    });

    it('should call API with provided ids', async () => {
      const { result } = renderHook(() => useFiles(), { wrapper });
      await act(async () => {
        await result.current.batchStar(['file-1'], ['folder-1'], true);
      });
      expect(mockPost).toHaveBeenCalledWith('/batch/star', { fileIds: ['file-1'], folderIds: ['folder-1'], isStarred: true });
    });
  });
});
