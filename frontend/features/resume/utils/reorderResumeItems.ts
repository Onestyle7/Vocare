export const reorderResumeItems = <T extends { id: string }>(
  items: T[],
  draggedId: string,
  targetId: string
): T[] => {
  const draggedIndex = items.findIndex((item) => item.id === draggedId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
    return items;
  }

  const reorderedItems = [...items];
  const [draggedItem] = reorderedItems.splice(draggedIndex, 1);
  reorderedItems.splice(targetIndex, 0, draggedItem);

  return reorderedItems;
};

export const reorderResumeItemByOffset = <T extends { id: string }>(
  items: T[],
  itemId: string,
  offset: -1 | 1
): T[] => {
  const currentIndex = items.findIndex((item) => item.id === itemId);
  const targetIndex = currentIndex + offset;

  if (currentIndex === -1 || targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  return reorderResumeItems(items, itemId, items[targetIndex].id);
};
