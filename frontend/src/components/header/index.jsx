import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/authContext'
import { doSignOut } from '../../services/firebase/auth'

const Header = () => {
    const navigate = useNavigate();
    const { userLoggedIn } = useAuth();

    return (
        <nav className='flex flex-row w-full gap-x-2 z-20 fixed top-0 left-0 h-12 border-b place-content-center items-center bg-gray-200'>
           

        </nav>
    )
}

export default Header