import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './NotificationPreferences.css';

const NotificationPreferences = () => {
    const queryClient = useQueryClient();
    const [preferences, setPreferences] = useState({
        email: {
            enabled: true,
            voucherReceived: true,
            voucherExpiring: true,
            redemptionConfirmation: true
        },
        sms: {
            enabled: false,
            phoneNumber: '',
            voucherReceived: false,
            voucherExpiring: true,
            redemptionConfirmation: true
        },
        push: {
            enabled: true,
            voucherReceived: true,
            voucherExpiring: true,
            redemptionConfirmation: true
        }
    });

    const [pushTokenRegistered, setPushTokenRegistered] = useState(false);

    // Fetch current preferences
    const { data: preferencesData, isLoading } = useQuery({
        queryKey: ['notificationPreferences'],
        queryFn: async () => {
            const response = await fetch('/api/notifications/preferences', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch preferences');
            return response.json();
        }
    });

    // Update preferences mutation
    const updatePreferencesMutation = useMutation({
        mutationFn: async (newPreferences) => {
            const response = await fetch('/api/notifications/preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newPreferences)
            });
            if (!response.ok) throw new Error('Failed to update preferences');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['notificationPreferences']);
        }
    });

    // Register push token mutation
    const registerPushTokenMutation = useMutation({
        mutationFn: async (tokenData) => {
            const response = await fetch('/api/notifications/push-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(tokenData)
            });
            if (!response.ok) throw new Error('Failed to register push token');
            return response.json();
        },
        onSuccess: () => {
            setPushTokenRegistered(true);
        }
    });

    useEffect(() => {
        if (preferencesData?.preferences) {
            setPreferences(preferencesData.preferences);
        }
    }, [preferencesData]);

    // Check if push notifications are supported and register token
    useEffect(() => {
        const registerPushToken = async () => {
            if ('serviceWorker' in navigator && 'Notification' in window) {
                try {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        // This is a simplified example - you'd integrate with Firebase Cloud Messaging
                        const token = 'mock-push-token-' + Date.now();
                        registerPushTokenMutation.mutate({
                            token,
                            deviceInfo: navigator.userAgent
                        });
                    }
                } catch (error) {
                    console.error('Failed to register push token:', error);
                }
            }
        };

        if (preferences.push.enabled && !pushTokenRegistered) {
            registerPushToken();
        }
    }, [preferences.push.enabled, pushTokenRegistered]);

    const handlePreferenceChange = (section, key, value) => {
        const newPreferences = {
            ...preferences,
            [section]: {
                ...preferences[section],
                [key]: value
            }
        };
        setPreferences(newPreferences);
    };

    const handleSave = () => {
        updatePreferencesMutation.mutate(preferences);
    };

    if (isLoading) {
        return <div className="notification-preferences-loading">Loading preferences...</div>;
    }

    return (
        <div className="notification-preferences">
            <div className="preferences-header">
                <h2>🔔 Notification Preferences</h2>
                <p>Customize how you receive notifications about your vouchers</p>
            </div>

            <div className="preferences-sections">
                {/* Email Preferences */}
                <div className="preference-section">
                    <div className="section-header">
                        <div className="section-icon">📧</div>
                        <div>
                            <h3>Email Notifications</h3>
                            <p>Receive notifications via email</p>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={preferences.email.enabled}
                                onChange={(e) => handlePreferenceChange('email', 'enabled', e.target.checked)}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                    
                    {preferences.email.enabled && (
                        <div className="preference-options">
                            <div className="preference-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={preferences.email.voucherReceived}
                                        onChange={(e) => handlePreferenceChange('email', 'voucherReceived', e.target.checked)}
                                    />
                                    New voucher received
                                </label>
                            </div>
                            <div className="preference-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={preferences.email.voucherExpiring}
                                        onChange={(e) => handlePreferenceChange('email', 'voucherExpiring', e.target.checked)}
                                    />
                                    Voucher expiring soon
                                </label>
                            </div>
                            <div className="preference-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={preferences.email.redemptionConfirmation}
                                        onChange={(e) => handlePreferenceChange('email', 'redemptionConfirmation', e.target.checked)}
                                    />
                                    Redemption confirmation
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* SMS Preferences */}
                <div className="preference-section">
                    <div className="section-header">
                        <div className="section-icon">📱</div>
                        <div>
                            <h3>SMS Notifications</h3>
                            <p>Receive notifications via text message</p>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={preferences.sms.enabled}
                                onChange={(e) => handlePreferenceChange('sms', 'enabled', e.target.checked)}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                    
                    {preferences.sms.enabled && (
                        <div className="preference-options">
                            <div className="preference-item phone-input">
                                <label>Phone Number:</label>
                                <input
                                    type="tel"
                                    value={preferences.sms.phoneNumber}
                                    onChange={(e) => handlePreferenceChange('sms', 'phoneNumber', e.target.value)}
                                    placeholder="+1234567890"
                                />
                            </div>
                            <div className="preference-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={preferences.sms.voucherReceived}
                                        onChange={(e) => handlePreferenceChange('sms', 'voucherReceived', e.target.checked)}
                                    />
                                    New voucher received
                                </label>
                            </div>
                            <div className="preference-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={preferences.sms.voucherExpiring}
                                        onChange={(e) => handlePreferenceChange('sms', 'voucherExpiring', e.target.checked)}
                                    />
                                    Voucher expiring soon
                                </label>
                            </div>
                            <div className="preference-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={preferences.sms.redemptionConfirmation}
                                        onChange={(e) => handlePreferenceChange('sms', 'redemptionConfirmation', e.target.checked)}
                                    />
                                    Redemption confirmation
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Push Preferences */}
                <div className="preference-section">
                    <div className="section-header">
                        <div className="section-icon">🔔</div>
                        <div>
                            <h3>Push Notifications</h3>
                            <p>Receive notifications on this device</p>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={preferences.push.enabled}
                                onChange={(e) => handlePreferenceChange('push', 'enabled', e.target.checked)}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                    
                    {preferences.push.enabled && (
                        <div className="preference-options">
                            <div className="preference-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={preferences.push.voucherReceived}
                                        onChange={(e) => handlePreferenceChange('push', 'voucherReceived', e.target.checked)}
                                    />
                                    New voucher received
                                </label>
                            </div>
                            <div className="preference-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={preferences.push.voucherExpiring}
                                        onChange={(e) => handlePreferenceChange('push', 'voucherExpiring', e.target.checked)}
                                    />
                                    Voucher expiring soon
                                </label>
                            </div>
                            <div className="preference-item">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={preferences.push.redemptionConfirmation}
                                        onChange={(e) => handlePreferenceChange('push', 'redemptionConfirmation', e.target.checked)}
                                    />
                                    Redemption confirmation
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="preferences-actions">
                <button 
                    className="save-button"
                    onClick={handleSave}
                    disabled={updatePreferencesMutation.isLoading}
                >
                    {updatePreferencesMutation.isLoading ? 'Saving...' : 'Save Preferences'}
                </button>
                
                {updatePreferencesMutation.isSuccess && (
                    <div className="success-message">✅ Preferences saved successfully!</div>
                )}
                
                {updatePreferencesMutation.isError && (
                    <div className="error-message">❌ Failed to save preferences. Please try again.</div>
                )}
            </div>
        </div>
    );
};

export default NotificationPreferences;