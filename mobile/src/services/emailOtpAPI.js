import apiClient, { apiRequest } from './api';
import API_CONFIG from '../config/api';

/**
 * Email OTP API Service
 * Handles OTP sending and verification for email
 */

export const emailOtpAPI = {
    /**
     * Send OTP to email
     * @param {string} email - Email address to send OTP to
     * @returns {Promise} Response with success status
     */
    sendOtp: async (email) => {
        return apiRequest(() =>
            apiClient.post(API_CONFIG.ENDPOINTS.EMAIL_OTP.SEND_OTP, { email })
        );
    },

    /**
     * Verify OTP
     * @param {string} email - Email address
     * @param {string} otp - 6-digit OTP code
     * @returns {Promise} Response with verification status
     */
    verifyOtp: async (email, otp) => {
        return apiRequest(() =>
            apiClient.post(API_CONFIG.ENDPOINTS.EMAIL_OTP.VERIFY_OTP, { email, otp })
        );
    },
};

export default emailOtpAPI;
