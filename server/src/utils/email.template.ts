export class EmailTemplates{

    static APIAccessRequest(resource='ENDPOINT', requester_name, resource_name, resource_id, producer_name){
        return ` <p>&nbsp;</p>
                  <!DOCTYPE html>
                  <html lang="en">
                    <head>
                      <meta charset="UTF-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                      <title>Intellex API Request</title>
                    </head>
                    <body style="font-family: Arial, sans-serif; background-color: #f8f8f8; color: #333333; margin: 0; padding: 0;">
                      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 8px;">
                      <div style="background-color: rgb(39, 3, 80); color: #ffffff; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; border-radius: 8px 8px 0 0;">
                        <img src="https://intellex.dev/images/logo.png" height=30/> <br/>
                          New API Access Request:  ${resource_name}
                        </div>
                        <div style="padding: 20px; font-size: 16px; line-height: 1.6;">
                          <p>Hi, ${producer_name}</p>
                          <p>We’re reaching out to notify you that someone has submitted a request to access your API. Below are the details of the request:</p>
                          <div style="background-color: #f2f9ff; border: 1px solid #008bff; border-radius: 6px; padding: 15px; margin-top: 15px;">
                            <div style="margin-bottom: 10px;"><strong>Requester:</strong> ${requester_name}</div>
                            <div style="margin-bottom: 10px;"><strong>Requested Resource: </strong> <a href="https://intellex.mininfra.gov.rw/marketplace/${resource=='ENDPOINT' ? 'endpoint?id='+resource_id+'&title='+resource_name : 'group?id='+resource_id+'&title='+resource_name}">${resource_name}</a></div>
                          </div>
                          <p>Head over to <a href="https://intellex.mininfra.gov.rw/connections/inbound">Integrations > Inbound</a> to approve or reject this request.</p>
                          <p>Kind regards,</p>
                          <p><strong>Intellex Team</strong></p>
                        </div>
                        <div style="margin-top: 20px; font-size: 14px; color: #666666; text-align: center;">
                          &copy; ${new Date().getFullYear()} Intellex. All rights reserved.
                        </div>
                      </div>
                    </body>
                  </html>
              `
    }

    static connectionGranted(resource, requester_name, resource_name, resource_id){
        return `
        <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>API Access Granted Notification</title>
            </head>
            <body style="font-family: Arial, sans-serif; background-color: #f8f8f8; color: #333333; margin: 0; padding: 0;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 8px;">
                <div style="background-color: rgb(39, 3, 80); color: #ffffff; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; border-radius: 8px 8px 0 0;">
                <img src="https://intellex.dev/images/logo.png" height=30/> <br/>
                  API Access Granted: ${resource_name}
                </div>
                <div style="padding: 20px; font-size: 16px; line-height: 1.6;">
                  <p>Hello ${requester_name},</p>
                  <p>We’re pleased to inform you that your request for API access has been granted.</p>
                  <div style="background-color: #f2f9ff; border: 1px solid #008bff; border-radius: 6px; padding: 15px; margin-top: 15px;">
                    <div style="margin-bottom: 10px;"><strong>Requested Resource: </strong> <a href="https://intellex.mininfra.gov.rw/marketplace/${resource=='ENDPOINT' ? 'endpoint?id='+resource_id+'&title='+resource_name : 'group?id='+resource_id+'&title='+resource_name}">${resource_name}</a></div>
                  </div>
                  <p>Make sure to place the <span style="font-family: monospace; background:#efefef; padding: 5px; border-radius:5px;color:#e58"> api-key</span> in the headers with every request. The api-key is accessible under <strong>Integrations > Outbound</strong>.</p>
                  <p>Thank you for using Intellex, and feel free to reach out if you have any questions.</p>
                  <p>Kind regards,</p>
                  <p><strong>Intellex Team</strong></p>
                </div>
                <div style="margin-top: 20px; font-size: 14px; color: #666666; text-align: center;">
                  &copy; ${new Date().getFullYear()} Intellex. All rights reserved.
                </div>
              </div>
            </body>
          </html>
        `
    }

    static connectionDenied(resource, requester_name, resource_name, resource_id){
        return `
        <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>API Access Request Status</title>
            </head>
            <body style="font-family: Arial, sans-serif; background-color: #f8f8f8; color: #333333; margin: 0; padding: 0;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 8px;">
                <div style="background-color: rgb(39, 3, 80); color: #ffffff; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; border-radius: 8px 8px 0 0;">
                    <img src="https://intellex.dev/images/logo.png" height=30/> <br/>
                  API Access Request Denied: ${resource_name}
                </div>
                <div style="padding: 20px; font-size: 16px; line-height: 1.6;">
                  <p>Hello ${requester_name},</p>
                  <p>We wanted to inform you that your request for API access has been <strong>rejected</strong> or <strong>revoked</strong>. Unfortunately, this means that you will not have access to this API resource, and subsequenly your api-key has become invalid.</p>

                  <div style="background-color: #f2f9ff; border: 1px solid #008bff; border-radius: 6px; padding: 15px; margin-top: 15px;">
                    <div style="margin-bottom: 10px;"><strong>Denied Resource: </strong> <a href="https://intellex.mininfra.gov.rw/marketplace/${resource=='ENDPOINT' ? 'endpoint?id='+resource_id+'&title='+resource_name : 'group?id='+resource_id+'&title='+resource_name}">${resource_name}</a></div>
                  </div>
                  <p>If you believe this decision was made in error, please contact the API provider directly to discuss your request.</p>
                  <p>Thank you for using Intellex, and feel free to reach out if you have further questions.</p>
                  <p>Kind regards,</p>
                  <p><strong>Intellex Team</strong></p>
                </div>
                <div style="margin-top: 20px; font-size: 14px; color: #666666; text-align: center;">
                  &copy; ${new Date().getFullYear()} Intellex. All rights reserved.
                </div>
              </div>
            </body>
          </html>
        `
    }


    static forgotPasswordLinkEmail(userFirstName: string, resetLink: string) {
        return `
        <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Forgot Password</title>
            </head>
            <body style="font-family: Arial, sans-serif; background-color: #f8f8f8; color: #333333; margin: 0; padding: 0;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 8px;">
                <div style="background-color: rgb(39, 3, 80); color: #ffffff; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; border-radius: 8px 8px 0 0;">
                    <img src="https://intellex.dev/images/logo.png" height=30/> <br/>
                  Reset Password
                </div>
                <div style="padding: 20px; font-size: 16px; line-height: 1.6;">
                  <p>Dear ${userFirstName},</p>

                  <p>
                    We received a request to reset your password for your Intellex account. Click the link below to reset your password: <br/><br/>
                  </p>


                  <div style="margin-bottom: 20px; text-align: center;"><a href="${resetLink}" target="blank" style="padding:10px; border-radius:10px; border:1px solid blue; text-decoration:none;">Reset Your Password</a></div>

                  <p>
                      If you did not request a password reset, please ignore this email. Your password will remain unchanged.
                  </p>

                  <p>Thank you for using Intellex, and feel free to reach out if you have further questions.</p>

                  <p>Kind regards,</p>
                  <p><strong>Intellex Team</strong></p>

                </div>
                <div style="margin-top: 20px; font-size: 14px; color: #666666; text-align: center;">
                  &copy; ${new Date().getFullYear()} Intellex. All rights reserved.
                </div>
              </div>
            </body>
          </html>`

    }


      static resetPasswordSuccess(userFirstName: string, loginLink: string) {
        return `
        <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Forgot Password</title>
            </head>
            <body style="font-family: Arial, sans-serif; background-color: #f8f8f8; color: #333333; margin: 0; padding: 0;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 8px;">
                <div style="background-color: rgb(39, 3, 80); color: #ffffff; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; border-radius: 8px 8px 0 0;">
                    <img src="https://intellex.dev/images/logo.png" height=30/> <br/>
                  Reset Password
                </div>
                <div style="padding: 20px; font-size: 16px; line-height: 1.6;">
                  <p>Dear ${userFirstName},</p>

                  <p>
                    You have successfully reset password for your Intellex account. Click the link below to sign in your account <br/><br/>
                  </p>


                  <div style="margin-bottom: 20px; text-align: center;"><a href="${loginLink}" target="blank" style="padding:10px; border-radius:10px; border:1px solid blue; text-decoration:none;">Login</a></div>

                  <p>
                      If you did not reset your password, Please contact Intellex Team at info@intellex.dev
                  </p>

                  <p>Thank you for using Intellex, and feel free to reach out if you have further questions.</p>

                  <p>Kind regards,</p>
                  <p><strong>Intellex Team</strong></p>

                </div>
                <div style="margin-top: 20px; font-size: 14px; color: #666666; text-align: center;">
                  &copy; ${new Date().getFullYear()} Intellex. All rights reserved.
                </div>
              </div>
            </body>
          </html>`

    }
}