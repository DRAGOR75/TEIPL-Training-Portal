export default function SuccessPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
            <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-green-100 max-w-md w-full">
                <div className="text-6xl mb-4">🎉</div>
                <h1 className="text-2xl font-bold text-green-800 mb-2">Feedback Submitted!</h1>
                <p className="text-green-700 font-medium">
                    Your attendance has been marked.
                </p>
                <div className="mt-6 bg-green-100 p-4 rounded-lg text-sm text-green-800">
                    <p className="font-bold mb-1">What's Next?</p>
                    <p>You will receive an email in roughly 25 days to verify how this training helped you in your daily work.</p>
                </div>
            </div>
        </div>
    );
}