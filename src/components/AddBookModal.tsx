
import BookFormModal from "./BookForm/BookFormModal";

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (book: any) => void;
  editingBook?: any;
}

const AddBookModal = ({ isOpen, onClose, onAdd, editingBook }: AddBookModalProps) => {
  return (
    <BookFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onAdd}
      editingBook={editingBook}
    />
  );
};

export default AddBookModal;
