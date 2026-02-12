class NotificationTemplates {
    static voucherReceived(voucherData) {
        const { voucherType, amount, merchantName, expiryDate } = voucherData;
        
        return {
            email: {
                subject: '🎉 New Voucher Received - ServicePass',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                            <h1>🎉 New Voucher Received!</h1>
                        </div>
                        <div style="padding: 20px; background-color: #f9f9f9;">
                            <h2>Great news! You've received a new voucher.</h2>
                            <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                <p><strong>Voucher Type:</strong> ${voucherType}</p>
                                <p><strong>Amount:</strong> $${amount}</p>
                                <p><strong>Valid at:</strong> ${merchantName}</p>
                                <p><strong>Expires:</strong> ${expiryDate}</p>
                            </div>
                            <p>You can redeem this voucher at any time before it expires. Login to your ServicePass account to view details.</p>
                            <div style="text-align: center; margin: 20px 0;">
                                <a href="${process.env.FRONTEND_URL}/dashboard" 
                                   style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                                   View My Vouchers
                                </a>
                            </div>
                        </div>
                        <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
                            ServicePass - Blockchain Voucher System
                        </div>
                    </div>
                `,
                text: `New Voucher Received!\n\nVoucher Type: ${voucherType}\nAmount: $${amount}\nValid at: ${merchantName}\nExpires: ${expiryDate}\n\nLogin to your ServicePass account to view details.`
            },
            sms: `🎉 New ${voucherType} voucher ($${amount}) received! Valid at ${merchantName}. Expires: ${expiryDate}. View details in ServicePass app.`,
            push: {
                title: 'New Voucher Received!',
                body: `You've received a $${amount} ${voucherType} voucher for ${merchantName}`,
                data: { type: 'voucher_received', voucherId: voucherData.voucherId }
            }
        };
    }

    static voucherExpiringSoon(voucherData) {
        const { voucherType, amount, merchantName, expiryDate, daysLeft } = voucherData;
        
        return {
            email: {
                subject: '⏰ Voucher Expiring Soon - ServicePass',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #FF9800; color: white; padding: 20px; text-align: center;">
                            <h1>⏰ Voucher Expiring Soon!</h1>
                        </div>
                        <div style="padding: 20px; background-color: #f9f9f9;">
                            <h2>Don't miss out! Your voucher expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.</h2>
                            <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #FF9800;">
                                <p><strong>Voucher Type:</strong> ${voucherType}</p>
                                <p><strong>Amount:</strong> $${amount}</p>
                                <p><strong>Valid at:</strong> ${merchantName}</p>
                                <p><strong>Expires:</strong> <span style="color: #FF9800; font-weight: bold;">${expiryDate}</span></p>
                            </div>
                            <p>Make sure to redeem this voucher before it expires! Visit ${merchantName} to use your credit.</p>
                            <div style="text-align: center; margin: 20px 0;">
                                <a href="${process.env.FRONTEND_URL}/dashboard" 
                                   style="background-color: #FF9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                                   Redeem Now
                                </a>
                            </div>
                        </div>
                        <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
                            ServicePass - Blockchain Voucher System
                        </div>
                    </div>
                `,
                text: `Voucher Expiring Soon!\n\nYour ${voucherType} voucher ($${amount}) expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.\nValid at: ${merchantName}\nExpires: ${expiryDate}\n\nRedeem it soon to avoid losing your credit!`
            },
            sms: `⏰ Your ${voucherType} voucher ($${amount}) expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}! Use it at ${merchantName} before ${expiryDate}.`,
            push: {
                title: 'Voucher Expiring Soon!',
                body: `Your $${amount} ${voucherType} voucher expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
                data: { type: 'voucher_expiring', voucherId: voucherData.voucherId }
            }
        };
    }

    static redemptionConfirmation(redemptionData) {
        const { voucherType, amount, merchantName, redemptionDate, transactionId } = redemptionData;
        
        return {
            email: {
                subject: '✅ Voucher Redeemed Successfully - ServicePass',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #2196F3; color: white; padding: 20px; text-align: center;">
                            <h1>✅ Redemption Successful!</h1>
                        </div>
                        <div style="padding: 20px; background-color: #f9f9f9;">
                            <h2>Your voucher has been successfully redeemed.</h2>
                            <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                <p><strong>Voucher Type:</strong> ${voucherType}</p>
                                <p><strong>Amount:</strong> $${amount}</p>
                                <p><strong>Redeemed at:</strong> ${merchantName}</p>
                                <p><strong>Date:</strong> ${redemptionDate}</p>
                                <p><strong>Transaction ID:</strong> ${transactionId}</p>
                            </div>
                            <p>Thank you for using ServicePass! Your voucher credit has been successfully applied.</p>
                            <div style="text-align: center; margin: 20px 0;">
                                <a href="${process.env.FRONTEND_URL}/redemption-history" 
                                   style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                                   View Transaction History
                                </a>
                            </div>
                        </div>
                        <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
                            ServicePass - Blockchain Voucher System
                        </div>
                    </div>
                `,
                text: `Voucher Redeemed Successfully!\n\nVoucher Type: ${voucherType}\nAmount: $${amount}\nRedeemed at: ${merchantName}\nDate: ${redemptionDate}\nTransaction ID: ${transactionId}\n\nThank you for using ServicePass!`
            },
            sms: `✅ Voucher redeemed! $${amount} ${voucherType} used at ${merchantName}. Transaction: ${transactionId}. Check ServicePass app for details.`,
            push: {
                title: 'Voucher Redeemed!',
                body: `Successfully redeemed $${amount} ${voucherType} voucher at ${merchantName}`,
                data: { type: 'redemption_confirmation', transactionId }
            }
        };
    }

    static merchantNotification(notificationData) {
        const { type, merchantName, amount, voucherType, customerInfo } = notificationData;
        
        if (type === 'redemption_received') {
            return {
                email: {
                    subject: '💰 New Voucher Redemption - ServicePass',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                                <h1>💰 New Redemption</h1>
                            </div>
                            <div style="padding: 20px; background-color: #f9f9f9;">
                                <h2>A customer has redeemed a voucher at your business.</h2>
                                <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                    <p><strong>Voucher Type:</strong> ${voucherType}</p>
                                    <p><strong>Amount:</strong> $${amount}</p>
                                    <p><strong>Customer:</strong> ${customerInfo}</p>
                                    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                                </div>
                                <div style="text-align: center; margin: 20px 0;">
                                    <a href="${process.env.FRONTEND_URL}/merchant/dashboard" 
                                       style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                                       View Dashboard
                                    </a>
                                </div>
                            </div>
                        </div>
                    `,
                    text: `New voucher redemption at ${merchantName}!\n\nAmount: $${amount}\nType: ${voucherType}\nCustomer: ${customerInfo}`
                },
                sms: `💰 New redemption: $${amount} ${voucherType} voucher redeemed at ${merchantName}. Customer: ${customerInfo}`,
                push: {
                    title: 'New Redemption',
                    body: `$${amount} ${voucherType} voucher redeemed at your business`,
                    data: { type: 'merchant_redemption', amount, voucherType }
                }
            };
        }
        
        static bulkOperationComplete(operationData) {
            const { operationType, totalRecords, successCount, failureCount, duration, batchId } = operationData;
            
            return {
                email: {
                    subject: `✅ Bulk ${operationType} Operation Complete - ServicePass`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
                                <h1>✅ Bulk Operation Complete!</h1>
                            </div>
                            <div style="padding: 20px; background-color: #f9f9f9;">
                                <h2>Your ${operationType} operation has been completed.</h2>
                                <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                    <p><strong>Operation:</strong> ${operationType}</p>
                                    <p><strong>Batch ID:</strong> ${batchId}</p>
                                    <p><strong>Total Records:</strong> ${totalRecords}</p>
                                    <p><strong>Successful:</strong> <span style="color: #4CAF50;">${successCount}</span></p>
                                    <p><strong>Failed:</strong> <span style="color: #F44336;">${failureCount}</span></p>
                                    <p><strong>Duration:</strong> ${duration}</p>
                                </div>
                                <div style="text-align: center; margin: 20px 0;">
                                    <a href="${process.env.FRONTEND_URL}/reports" 
                                       style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                                       View Detailed Report
                                    </a>
                                </div>
                            </div>
                        </div>
                    `,
                    text: `Bulk ${operationType} Complete!\\n\\nBatch ID: ${batchId}\\nTotal: ${totalRecords}\\nSuccessful: ${successCount}\\nFailed: ${failureCount}\\nDuration: ${duration}\\n\\nView detailed report in your ServicePass dashboard.`
                },
                sms: `✅ Bulk ${operationType} complete! ${successCount}/${totalRecords} successful. Batch ID: ${batchId}`,
                push: {
                    title: 'Bulk Operation Complete',
                    body: `${operationType}: ${successCount}/${totalRecords} successful`,
                    data: { type: 'bulk_operation_complete', batchId }
                }
            };
        }
        
        static systemMaintenance(maintenanceData) {
            const { maintenanceType, startTime, endTime, affectedServices, description } = maintenanceData;
            
            return {
                email: {
                    subject: '🔧 Scheduled Maintenance Notification - ServicePass',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background-color: #FF9800; color: white; padding: 20px; text-align: center;">
                                <h1>🔧 Scheduled Maintenance</h1>
                            </div>
                            <div style="padding: 20px; background-color: #f9f9f9;">
                                <h2>We'll be performing ${maintenanceType} maintenance on our system.</h2>
                                <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #FF9800;">
                                    <p><strong>Start Time:</strong> ${startTime}</p>
                                    <p><strong>End Time:</strong> ${endTime}</p>
                                    <p><strong>Affected Services:</strong> ${affectedServices}</p>
                                    <p><strong>Description:</strong> ${description}</p>
                                </div>
                                <p>During this time, some services may be temporarily unavailable.</p>
                            </div>
                        </div>
                    `,
                    text: `Scheduled Maintenance\\n\\nType: ${maintenanceType}\\nStart: ${startTime}\\nEnd: ${endTime}\\n\\n${description}`
                },
                sms: `🔧 ServicePass maintenance: ${maintenanceType} from ${startTime} to ${endTime}. Some services may be unavailable.`,
                push: {
                    title: 'Scheduled Maintenance',
                    body: `${maintenanceType} maintenance from ${startTime} to ${endTime}`,
                    data: { type: 'maintenance', maintenanceType }
                }
            };
        }
        
        static securityAlert(alertData) {
            const { alertType, timestamp, ipAddress, action, location } = alertData;
            
            return {
                email: {
                    subject: '🚨 Security Alert - ServicePass',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background-color: #F44336; color: white; padding: 20px; text-align: center;">
                                <h1>🚨 Security Alert</h1>
                            </div>
                            <div style="padding: 20px; background-color: #f9f9f9;">
                                <h2>We detected ${alertType} activity on your account.</h2>
                                <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #F44336;">
                                    <p><strong>Alert Type:</strong> ${alertType}</p>
                                    <p><strong>Time:</strong> ${timestamp}</p>
                                    <p><strong>IP Address:</strong> ${ipAddress}</p>
                                    <p><strong>Location:</strong> ${location || 'Unknown'}</p>
                                    <p><strong>Action:</strong> ${action}</p>
                                </div>
                                <p>If this was you, you can ignore this message. If not, please secure your account immediately.</p>
                            </div>
                        </div>
                    `,
                    text: `Security Alert!\\n\\nType: ${alertType}\\nTime: ${timestamp}\\nIP: ${ipAddress}\\nAction: ${action}\\n\\nIf this wasn't you, please secure your account.`
                },
                sms: `🚨 Security Alert: ${alertType} detected on your ServicePass account. If this wasn't you, secure your account now.`,
                push: {
                    title: 'Security Alert',
                    body: `${alertType} detected on your account`,
                    data: { type: 'security_alert', alertType }
                }
            };
        }
    }
}

module.exports = NotificationTemplates;