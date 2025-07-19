const { useState, useEffect } = React;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const [otp, setOtp] = useState(Array(6).fill(''));
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleOtpChange = (e, index) => {
        const value = e.target.value;
        if (/^\d$/.test(value) || value === '') {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            if (value !== '' && index < 5) {
                e.target.nextElementSibling.focus();
            }
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (e.target.value === '' && index > 0) {
                e.preventDefault();
                e.target.previousElementSibling.focus();
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
            } else if (e.target.value !== '') {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            e.target.previousElementSibling.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            e.target.nextElementSibling.focus();
        } else if (!/^\d$/.test(e.key) && e.key !== 'Tab' && e.key !== 'Enter') {
            e.preventDefault();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (otp.some(digit => digit === '') || otp.join('').length !== 6) {
            setError('Please enter a complete 6-digit OTP.');
            return;
        }

        if (newPassword === '') {
            setError('Please enter a new password.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New password and confirm password do not match.');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setSuccess(true);
            setLoading(false);
        }, 1500);
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="login-container rounded-xl p-8 w-full max-w-md shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">OTP Verification</h1>
                    <p className="text-gray-400">Enter OTP and set new password</p>
                </div>
                
                {error && (
                    <div className="bg-red-900/50 text-red-200 p-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}
                
                {success ? (
                    <div className="bg-green-900/50 text-green-200 p-3 rounded-lg mb-4">
                        OTP verified! Password updated successfully. ✅
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="otp" className="block text-gray-400 mb-2">Verification Code</label>
                            <div className="flex justify-center gap-2">
                                {otp.map((digit, i) => (
                                    <input 
                                        key={i} 
                                        type="tel" 
                                        maxLength="1"
                                        className="w-12 h-12 text-center text-xl rounded-lg input-field caret-indigo-400 focus:text-indigo-400"
                                        required
                                        inputMode="numeric"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(e, i)}
                                        onKeyDown={(e) => handleOtpKeyDown(e, i)}
                                        onFocus={(e) => e.target.select()}
                                    />
                                ))}
                            </div>
                            <p className="text-right text-sm text-indigo-400 mt-2 cursor-pointer hover:text-indigo-300 transition-colors">Resend OTP</p>
                        </div>
                        <div className="text-center text-sm text-gray-400 mb-6">
                            We've sent a 6-digit code to your email.
                        </div>
                        
                        <div className="mb-4">
                            <label htmlFor="newPassword" className="block text-gray-400 mb-2">New Password</label>
                            <input
                                id="newPassword"
                                type="password"
                                className="w-full p-3 rounded-lg input-field text-white caret-indigo-400"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label htmlFor="confirmPassword" className="block text-gray-400 mb-2">Confirm New Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className="w-full p-3 rounded-lg input-field text-white caret-indigo-400"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${loading ? 'bg-indigo-800/50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {loading ? 'Verifying...' : 'Verify & Reset Password'}
                        </button>
                    </form>
                )}
                
                <div className="mt-6 text-center">
                    <p className="text-gray-400">Back to <a href="../Login Page/Login.html" className="text-indigo-400 hover:text-indigo-300">login</a></p>
                </div>
            </div>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(<LoginPage />);

document.addEventListener('DOMContentLoaded', () => {
    const bgAnimation = document.getElementById('bgAnimation');
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+{}|:<>?=[];,./~`";
    for (let i = 0; i < 256; i++) {
        const span = document.createElement('span');
        span.textContent = characters.charAt(Math.floor(Math.random() * characters.length));
        bgAnimation.appendChild(span);
    }
    setInterval(() => {
        const spans = document.querySelectorAll('.bg-animation span');
        spans.forEach(span => {
            if (Math.random() > 0.7) {
                span.textContent = characters.charAt(Math.floor(Math.random() * characters.length));
            }
        });
    }, 100);
});

function mockLoginEndpoint(request) {
    const users = [
        { email: 'admin@example.com', password: 'password123' },
        { email: 'user@example.com', password: 'secret321' }
    ];
    
    const user = users.find(u => 
        u.email === request.email && 
        u.password === request.password
    );
    
    if (user) {
        return {
            success: true,
            message: 'Login successful',
            user: {
                email: user.email,
                token: 'mock-jwt-token-123456'
            }
        };
    } else {
        return {
            success: false,
            message: 'Invalid email or password'
        };
    }
}

const originalFetch = window.fetch;
window.fetch = async function(url, options) {
    if (url === 'api/login.php') {
        const body = JSON.parse(options.body);
        const result = mockLoginEndpoint(body);
        
        return Promise.resolve({
            ok: result.success,
            json: () => Promise.resolve(result),
        });
    }
    
    return originalFetch.apply(this, arguments);
};