import Cookies from 'js-cookie';

export function logout(router: any) {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userRole");
  
  Cookies.remove("token");
  Cookies.remove("user");
  
  
  router.push("/login");
}