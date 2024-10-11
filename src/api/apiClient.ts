import axios, { AxiosInstance, AxiosError, AxiosResponse } from "axios";
import config from "../config";
import * as auth from "../auth";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class ApiClient {
  private static instance: ApiClient;
  private axiosInstance: AxiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.api,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(async (config) => {
      const token = await auth.getToken();
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      } else {
        // Redirect to the auth page if there is no token
        await auth.authorize();
        const newToken = await auth.getToken();
        config.headers["Authorization"] = `Bearer ${newToken}`;
      }
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      this.handleSuccess,
      this.handleError.bind(this), // Bind 'this' to maintain context
    );
  }

  private handleSuccess(response: AxiosResponse): AxiosResponse {
    return response;
  }

  private handleError = (error: AxiosError): Promise<never> => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const apiError = new ApiError(
        error.response.status,
        error.response.data.message || "An error occurred",
        error.response.data,
      );
      return this.centralErrorHandler(apiError);
    } else if (error.request) {
      // The request was made but no response was received
      return this.centralErrorHandler(new ApiError(0, "No response received from server"));
    } else {
      // Something happened in setting up the request that triggered an Error
      return this.centralErrorHandler(new ApiError(0, error.message));
    }
  };

  private centralErrorHandler = async (error: ApiError): Promise<never> => {
    // Log the error
    console.error(`API Error ${error.status}: ${error.message}`, error.data);

    // Here you can add centralized error handling logic
    // For example, you could:
    // - Send error to a logging service
    // - Show a global notification to the user
    // - Refresh the auth token if it's expired
    // - Logout the user if the token is invalid

    if (error.status === 401) {
      // Handle unauthorized error (e.g., logout user)
      auth.logout();
      await auth.authorize();
    }
    // retry the request
    return this.axiosInstance.request(error.config);
  };

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  public getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

export default ApiClient.getInstance().getAxiosInstance();
