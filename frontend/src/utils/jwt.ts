export const saveToken = (token: string) => {
  localStorage.setItem("jwt", token);
};

export const getToken = () => {
  return localStorage.getItem("jwt");
};

export const clearToken = () => {
  localStorage.removeItem("jwt");
};
