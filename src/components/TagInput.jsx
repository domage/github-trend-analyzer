import React, { useState, useRef, useEffect } from 'react';

/**
 * TagInput component - An input field that allows adding multiple tags/search terms
 * with complete keyboard navigation, multi-selection, and management
 */
function TagInput({ tags, setTags, onAnalyze, isLoading }) {
  const [inputValue, setInputValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [selectedTagIndices, setSelectedTagIndices] = useState([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(-1);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [blinkedTagIndices, setBlinkedTagIndices] = useState([]);

  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const tagRefs = useRef([]);
  const editInputRef = useRef(null);

  // Update tag refs whenever tags change
  useEffect(() => {
    tagRefs.current = tagRefs.current.slice(0, tags.length);
  }, [tags]);

  // Method to handle tag deletion with consistent focus behavior
  const handleTagDeletion = (indicesToDelete) => {
    // Sort indices in descending order to avoid index shifting problems
    const sortedIndices = [...indicesToDelete].sort((a, b) => b - a);
    const newTags = [...tags];
    
    // Remove tags from highest index to lowest
    sortedIndices.forEach(idx => {
      newTags.splice(idx, 1);
    });
    
    setTags(newTags);
    
    // Determine where to focus next
    if (newTags.length > 0) {
      // Default to the right of the deleted tags
      const maxDeletedIndex = Math.max(...sortedIndices);
      let closestIndex = maxDeletedIndex;
      
      // If the right side is out of bounds, move to the left
      if (closestIndex >= newTags.length) {
        closestIndex = newTags.length - 1;
      }
      
      setSelectedTagIndices([closestIndex]);
      setLastSelectedIndex(closestIndex);
      
      // Ensure the tag is focused
      if (tagRefs.current[closestIndex]) {
        tagRefs.current[closestIndex].focus();
      }
    } else {
      // No pills left, focus the input
      setSelectedTagIndices([]);
      inputRef.current.focus();
    }
  };

  // Handle keyboard input in the input field
  const handleKeyDown = (e) => {
    // Enter key: add tag or submit
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTags();
      } else if (tags.length > 0) {
        onAnalyze();
      }
    } 
    // Semicolon: add tag
    else if (e.key === ';') {
      e.preventDefault();
      addTags();
    }
    // Left arrow: navigate to tags from input
    else if (e.key === 'ArrowLeft') {
      if (inputValue === '' && tags.length > 0) {
        const newIndex = tags.length - 1;
        
        if (e.shiftKey) {
          // Multi-select with shift
          setSelectedTagIndices([...selectedTagIndices, newIndex]);
          setLastSelectedIndex(newIndex);
        } else {
          // Single select
          setSelectedTagIndices([newIndex]);
          setLastSelectedIndex(newIndex);
        }
        e.preventDefault();
      }
    }
    // Backspace: remove last tag if input is empty and no tags are selected
    else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0 && selectedTagIndices.length === 0) {
      const newTags = [...tags];
      newTags.pop();
      setTags(newTags);
    }
    // Copy selected tags when Ctrl+C is pressed
    else if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedTagIndices.length > 0) {
      copySelectedTags(e);
    }
  };

  // Handle keyboard navigation within tags
  const handleTagKeyDown = (e, index) => {
    e.stopPropagation();
    
    // Delete or Backspace: remove selected tags and manage focus
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTagIndices.length > 0) {
      handleTagDeletion(selectedTagIndices);
      e.preventDefault();
    }
    // Enter: edit the selected tag
    else if (e.key === 'Enter' && selectedTagIndices.length === 1) {
      setEditingIndex(index);
      e.preventDefault();
    }
    // Left arrow: move selection
    else if (e.key === 'ArrowLeft') {
      if (index > 0) {
        const newIndex = index - 1;
        
        if (e.shiftKey) {
          // Multi-select with shift, expanding from the last selected index
          const currentSelection = new Set(selectedTagIndices);
          
          // Determine range based on last selected index
          if (lastSelectedIndex >= 0) {
            const minIndex = Math.min(lastSelectedIndex, newIndex);
            const maxIndex = Math.max(lastSelectedIndex, newIndex);
            
            // Add all indices in the range
            for (let i = minIndex; i <= maxIndex; i++) {
              currentSelection.add(i);
            }
          } else {
            currentSelection.add(newIndex);
          }
          
          setSelectedTagIndices([...currentSelection]);
        } else {
          // Single select
          setSelectedTagIndices([newIndex]);
          setLastSelectedIndex(newIndex);
        }
        e.preventDefault();
      }
    }
    // Right arrow: move selection
    else if (e.key === 'ArrowRight') {
      if (index < tags.length - 1) {
        const newIndex = index + 1;
        
        if (e.shiftKey) {
          // Multi-select with shift, expanding from the last selected index
          const currentSelection = new Set(selectedTagIndices);
          
          // Determine range based on last selected index
          if (lastSelectedIndex >= 0) {
            const minIndex = Math.min(lastSelectedIndex, newIndex);
            const maxIndex = Math.max(lastSelectedIndex, newIndex);
            
            // Add all indices in the range
            for (let i = minIndex; i <= maxIndex; i++) {
              currentSelection.add(i);
            }
          } else {
            currentSelection.add(newIndex);
          }
          
          setSelectedTagIndices([...currentSelection]);
        } else {
          // Single select
          setSelectedTagIndices([newIndex]);
          setLastSelectedIndex(newIndex);
        }
        e.preventDefault();
      } else if (!e.shiftKey) {
        // Move to input if at the last tag and not using shift selection
        setSelectedTagIndices([]);
        inputRef.current.focus();
        e.preventDefault();
      }
      // If using shift selection and at the last pill, don't clear selection
    }
    // Escape: deselect tag and focus input
    else if (e.key === 'Escape') {
      setSelectedTagIndices([]);
      inputRef.current.focus();
      e.preventDefault();
    }
    // Ctrl+A or Cmd+A: select all tags
    else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      const allIndices = Array.from({ length: tags.length }, (_, i) => i);
      setSelectedTagIndices(allIndices);
    }
    // Copy selected tags when Ctrl+C is pressed
    else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      copySelectedTags(e);
    }
  };

  // Copy selected tags to clipboard
  const copySelectedTags = (e) => {
    e.preventDefault();
    
    if (selectedTagIndices.length > 0) {
      const selectedTags = selectedTagIndices
        .sort((a, b) => a - b)
        .map(index => tags[index])
        .join('; ');
      
      navigator.clipboard.writeText(selectedTags)
        .catch(err => {
          console.error('Could not copy tags: ', err);
        });
    }
  };

  const cancelEditing = (index) => {
    setEditingIndex(-1);
    setTimeout(() => {
      tagRefs.current[index]?.focus();
    }, 0);
  };

  // Handle editing of a tag
  const handleEditKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      finishEditing(index);
      e.preventDefault();
    } else if (e.key === 'Escape') {
        cancelEditing(index);
        e.preventDefault();
    }
  };

  const finishEditing = (index) => {
    const newValue = editInputRef.current.value.trim();

    if (newValue === '') {
      setEditingIndex(-1);
      handleTagDeletion([index]);
      return;
    }
  
    // Check for duplicates (excluding the one we're editing)
    const duplicateIndex = tags.findIndex((tag, i) => tag === newValue && i !== index);
    if (duplicateIndex !== -1) {
      // Just blink the duplicate — don't exit edit mode
      setBlinkedTagIndices([duplicateIndex]);
      setTimeout(() => setBlinkedTagIndices([]), 400);
      return;
    }
  
    // Proceed with saving the edit
    if (newValue !== tags[index]) {
      const newTags = [...tags];
      newTags[index] = newValue;
      setTags(newTags);
      setEditingIndex(-1);
  
      setTimeout(() => {
        tagRefs.current[index]?.focus();
      }, 0);
    } else {
      cancelEditing(index);
    }
  };  

  // Focus the selected tag when selection changes
  useEffect(() => {
    if (selectedTagIndices.length > 0) {
      // Focus the last selected tag
      const lastIndex = selectedTagIndices[selectedTagIndices.length - 1];
      if (tagRefs.current[lastIndex]) {
        tagRefs.current[lastIndex].focus();
      }
    }
  }, [selectedTagIndices]);

  // Focus edit input when entering edit mode
  useEffect(() => {
    if (editingIndex >= 0 && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  // Handle tag click
  const handleTagClick = (index, e) => {
    e.stopPropagation();
    
    // Multi-select with shift
    if (e.shiftKey && selectedTagIndices.length > 0) {
      const lastIndex = lastSelectedIndex;
      const minIndex = Math.min(lastIndex, index);
      const maxIndex = Math.max(lastIndex, index);
      const newIndices = [];
      
      // Select all tags in the range
      for (let i = minIndex; i <= maxIndex; i++) {
        newIndices.push(i);
      }
      
      setSelectedTagIndices(newIndices);
    } 
    // Multi-select with Ctrl/Cmd
    else if ((e.ctrlKey || e.metaKey) && selectedTagIndices.length > 0) {
      if (selectedTagIndices.includes(index)) {
        // Remove from selection if already selected
        setSelectedTagIndices(selectedTagIndices.filter(i => i !== index));
      } else {
        // Add to selection
        setSelectedTagIndices([...selectedTagIndices, index]);
      }
    } 
    // Normal click (single select)
    else {
      setSelectedTagIndices([index]);
      setLastSelectedIndex(index);
    }
  };

  // Handle double click to edit
  const handleTagDoubleClick = (index, e) => {
    e.stopPropagation();
    setEditingIndex(index);
  };

  // Handle input change
  const handleChange = (e) => {
    const value = e.target.value;
    // If the input contains semicolons, split and add as tags
    if (value.includes(';')) {
      const parts = value.split(';');
      const lastPart = parts.pop(); // Keep the last part in the input
      
      // Process all parts except the last one as tags
      const newTags = [...parts.map(part => part.trim()).filter(part => part !== '')];
      if (newTags.length > 0) {
        addTagsFromArray(newTags);
      }
      
      setInputValue(lastPart);
    } else {
      setInputValue(value);
    }
  };

  // Handle paste event
  const handlePaste = (e) => {
    e.preventDefault();
    
    // Get pasted content from clipboard
    const pastedText = e.clipboardData.getData('text');
    
    if (pastedText) {
      // Split pasted content by semicolons, commas, and/or newlines
      const parts = pastedText.split(/[;,\n]/);
      
      if (parts.length > 1) {
        // Process all parts as tags
        const newTags = parts.map(part => part.trim()).filter(part => part !== '');
        addTagsFromArray(newTags);
      } else {
        // If no delimiters, just add to the input value
        setInputValue(inputValue + pastedText);
      }
    }
  };

  // Add tags from the current input value
  const addTags = () => {
    const rawTags = inputValue.split(';')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');

    if (rawTags.length === 0) return;

    const newTags = rawTags.filter(tag => !tags.includes(tag));
    const duplicates = rawTags.filter(tag => tags.includes(tag));

    if (newTags.length > 0) {
      setTags([...tags, ...newTags]);
      setInputValue(''); // only clear if we added something
    }

    if (duplicates.length > 0) {
      // Highlight all duplicates
      const duplicateIndices = tags
        .map((tag, i) => duplicates.includes(tag) ? i : -1)
        .filter(i => i !== -1);

      setBlinkedTagIndices(duplicateIndices);
      setTimeout(() => setBlinkedTagIndices([]), 400);
    }
  };

  // Add tags from an array of strings
  const addTagsFromArray = (newTags) => {
    const trimmedNewTags = newTags.map(tag => tag.trim()).filter(tag => tag !== '');

    const uniqueNewTags = trimmedNewTags.filter(tag => !tags.includes(tag));
    const duplicateTags = trimmedNewTags.filter(tag => tags.includes(tag));
  
    if (uniqueNewTags.length > 0) {
      setTags([...tags, ...uniqueNewTags]);
    }
  
    if (duplicateTags.length > 0) {
      const duplicateIndices = tags
        .map((tag, i) => duplicateTags.includes(tag) ? i : -1)
        .filter(i => i !== -1);
  
      setBlinkedTagIndices(duplicateIndices);
      setTimeout(() => setBlinkedTagIndices([]), 400);
    }
  };

  // Remove a specific tag
  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
    inputRef.current.focus();
    setSelectedTagIndices([]);
  };

  // Make the tags interactive (keyboard navigation, selection, etc.)
  const makeTagInteractive = (tag, index) => {
    return {
      onClick: (e) => handleTagClick(index, e),
      onDoubleClick: (e) => handleTagDoubleClick(index, e),
      onKeyDown: (e) => handleTagKeyDown(e, index),
      tabIndex: 0, // Make focusable with keyboard
      ref: (el) => (tagRefs.current[index] = el)
    };
  };
  
  // Focus the input when clicking on the container
  const handleContainerClick = (e) => {
    // Only focus input if clicking directly on the container (not on a tag)
    if (e.target === containerRef.current) {
      inputRef.current.focus();
      setSelectedTagIndices([]);
    }
  };

  // Focus input on blur from a tag if no other tag is focused
  const handleTagBlur = (e) => {
    // Don't clear selection if focus is moving to another tag or if we're selecting text
    const isAnotherTagFocused = tagRefs.current.some(ref => ref === e.relatedTarget);
    if (!isAnotherTagFocused && e.relatedTarget !== inputRef.current && !window.getSelection().toString()) {
      setSelectedTagIndices([]);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    setFocused(true);
    // Don't clear selection on input focus - this allows better interaction between input and tags
  };

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current && tags.length === 0) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="mb-6">
      <div 
        ref={containerRef}
        className={`flex flex-wrap items-center w-full p-2 border ${focused ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'} rounded-md bg-white min-h-[46px]`}
        onClick={handleContainerClick}
      >
        {/* Render existing tags */}
        {tags.map((tag, index) => (
          <div 
            key={index} 
            className={`flex items-center px-2 py-1 rounded-md mr-2 mb-1 max-w-full transition
                ${editingIndex === index 
                  ? 'bg-gray-100 text-gray-800 ring-1 ring-gray-300' 
                  : selectedTagIndices.includes(index) 
                    ? 'bg-blue-500 text-white ring-2 ring-blue-300' 
                    : 'bg-blue-100 text-blue-800'
                }
                ${blinkedTagIndices.includes(index) ? 'animate-blink' : ''}
                `}
            {...(editingIndex === index ? {} : makeTagInteractive(tag, index))}
            onBlur={handleTagBlur}
          >
            {editingIndex === index ? (
              <input
                ref={editInputRef}
                type="text"
                className="outline-none bg-transparent w-full text-blue-800"
                defaultValue={tag}
                onKeyDown={(e) => handleEditKeyDown(e, index)}
                onBlur={() => finishEditing(index)}
              />
            ) : (
              <span className="cursor-text overflow-hidden text-ellipsis">
                {tag}
              </span>
            )}
            {editingIndex !== index && (
              <button
                type="button"
                className={`ml-1 focus:outline-none ${
                  selectedTagIndices.includes(index) ? 'text-white' : 'text-blue-600 hover:text-blue-800'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        
        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          className="flex-grow outline-none min-w-[120px] py-1"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={handleInputFocus}
          onBlur={() => setFocused(false)}
          placeholder={tags.length === 0 ? "Enter search terms (use ; to separate multiple terms)" : ""}
        />
        
        {/* Analyze button */}
        <button
          type="button"
          className="ml-2 px-4 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          onClick={() => {
            const trimmedInput = inputValue.trim();

            if (trimmedInput) {
              const newTags = trimmedInput
                .split(';')
                .map(tag => tag.trim())
                .filter(tag => tag !== '' && !tags.includes(tag));

              const updatedTags = [...tags, ...newTags];

              setTags(updatedTags);
              setInputValue('');

              console.log("Input:", inputValue);
              console.log("Tags before update:", tags);
              console.log("New tags from input:", newTags);
              console.log("Updated tags that will be passed:", updatedTags);

              if (updatedTags.length > 0) {
                onAnalyze(updatedTags);
              }
            } else if (tags.length > 0) {
              onAnalyze(tags);
            }
          }}
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
      
      {/* Keyboard shortcuts hint */}
      {tags.length > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          <span>Tip: Use arrow keys to navigate tags. Hold Shift to select multiple tags. Press Enter to edit. Ctrl+C to copy selected.</span>
        </div>
      )}
    </div>
  );
}

export default TagInput;