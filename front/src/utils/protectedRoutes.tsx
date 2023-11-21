import { UserDetails } from "../model/UserDetails";
import React, { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
user: UserDetails | null;
redirectPath?: string;
children?: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, redirectPath = '/signin', children }) => {
	//console.log('user in protected route', user);
	if (!user) {
		return <Navigate to={redirectPath} replace />;
	}
  
	return children ? <>{children}</> : <Outlet />;
  };
  

export default ProtectedRoute;