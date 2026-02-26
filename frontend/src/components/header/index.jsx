import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/authContext'
import { doSignOut } from '../../services/firebase/auth'

const Header = () => {
    const navigate = useNavigate();
    const { userLoggedIn } = useAuth();

    return (
        <nav className='flex flex-row w-full gap-x-2 z-20 fixed top-0 left-0 h-12 border-b place-content-center items-center bg-gray-200'>
            {userLoggedIn ? (
                <>
                    <Link to="/home" className='px-3 py-1 text-sm font-medium hover:bg-gray-300 rounded'>
                        Home
                    </Link>
                    <Link to="/mealpreferences" className='px-3 py-1 text-sm font-medium hover:bg-gray-300 rounded'>
                        Meal Preferences
                    </Link>
                    <Link to="/recipes" className='px-3 py-1 text-sm font-medium hover:bg-gray-300 rounded'>
                        Recipes
                    </Link>
                    <button 
                        onClick={() => {
                            doSignOut();
                            navigate('/login');
                        }}
                        className='px-3 py-1 text-sm font-medium hover:bg-red-300 rounded'
                    >
                        Logout
                    </button>
                </>
            ) : (
                <>
                    <Link to="/login" className='px-3 py-1 text-sm font-medium hover:bg-gray-300 rounded'>
                        Login
                    </Link>
                    <Link to="/register" className='px-3 py-1 text-sm font-medium hover:bg-gray-300 rounded'>
                        Register
                    </Link>
                </>
            )}
        </nav>
    )
}

export default Header