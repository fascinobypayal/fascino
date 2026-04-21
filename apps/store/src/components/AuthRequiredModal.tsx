import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthRequiredModal = ({ isOpen, onClose }: AuthRequiredModalProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = () => {
    onClose();
    navigate('/login', { state: { from: location.pathname } });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] sm:max-w-sm rounded-xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">Login Required</DialogTitle>
          <DialogDescription>
            Please login to continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-3 sm:flex-row">
          <button
            onClick={onClose}
            className="flex-1 btn-premium py-3 text-sm uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            onClick={handleLogin}
            className="flex-1 btn-filled py-3 text-sm uppercase tracking-wider"
          >
            Login
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthRequiredModal;
