import Login from "@/components/auth/Login"
import { FC } from "react"

interface LoginModalProps {
    onClose: () => void;
}
const LoginModal: FC<LoginModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-51">
            <div className="rounded-lg shadow-xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-black transition duration-200">
                    ✖
                </button>
                <Login onLoginSuccess={onClose} />
            </div>
        </div>
    )
}

export default LoginModal