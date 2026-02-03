import React from 'react'
import { useAuth } from '../../contexts/authContext'
import Header from '../header';

const Profile = () => {
    const { userLoggedIn } = useAuth();

    return (
        <div>
            <Header></Header>
            {
                userLoggedIn?
                <>
                    Diet
                </> :
                <>
                    <p>Please login to use this feature</p>
                </>
            }
        </div>
    )
}

export default Profile