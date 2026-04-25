import axios from "axios";
import toast from "react-hot-toast";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
) => {
  if (!name || !email || !password) {
    toast.error("Provide all details");
    return false;
  }

  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      name,
      email,
      password,
    });
    const data = response.data as { message?: string } | undefined;

    toast.success(data?.message ?? "Account created");
    return true;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ?? "Could not create account";
    toast.error(message);
    return false;
  } 
};

export const loginUser=async(email: string, password: string) => {
  if(!email || !password) {
    toast.error("Provide all fields")
    return false;
  }
  try{
     const result= await axios.post(`${API_URL}/auth/login`, {email, password}, {withCredentials:true})
     if(result){
      toast.success("Logged in");
      return true;
     }
  }
  catch (error:any) {
    const message = error?.response?.data?.message ?? "Could not log in";
    toast.error(message)
    return false;
  }
}


export const getCurrentUser = async () => {
  const response = await axios.get<{ user: CurrentUser }>(`${API_URL}/auth/me`, {
    withCredentials: true,
  });

  return response.data.user;
};
