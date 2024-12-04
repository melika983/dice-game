import React, { useState } from 'react';

function App() {
    const [claimedRewards, setClaimedRewards] = useState(0);  // وضعیت تعداد جوایز دریافت شده با مقدار اولیه ۰
    const [leaderboard, setLeaderboard] = useState([]);  // وضعیت جدول رده‌بندی (لیست رتبه‌ها) با مقدار اولیه یک آرایه خالی
    const [showClaimButton, setShowClaimButton] = useState(false);  // وضعیت برای نشان دادن دکمه "Claim Rewards" با مقدار اولیه false
    const [totalScore, setTotalScore] = useState(0);  // وضعیت برای ذخیره نمره کل بازیکن با مقدار اولیه ۰

    // تابع برای ثبت‌نام کاربر
    const register = async () => {
        const email = prompt("Enter your email:");  // درخواست ایمیل از کاربر
        const response = await fetch('http://localhost:3000/register', {  // ارسال درخواست POST برای ثبت‌نام
            method: 'POST',  // مشخص کردن متد POST
            headers: { 'Content-Type': 'application/json' },  // تعیین نوع محتوا به صورت JSON
            body: JSON.stringify({ email })  // ارسال ایمیل کاربر به سرور
        });
        const data = await response.json();  // تجزیه داده‌های دریافتی از سرور به فرمت JSON
        alert(data.message);  // نمایش پیام دریافت‌شده از سرور به کاربر
    };

    // تابع برای ورود کاربر
    const login = async () => {
        const email = prompt("Enter your email:");  // درخواست ایمیل از کاربر
        const verificationCode = prompt("Enter your verification code:");  // درخواست کد تأیید از کاربر
        const response = await fetch('http://localhost:3000/login', {  // ارسال درخواست POST برای ورود
            method: 'POST',  // مشخص کردن متد POST
            headers: { 'Content-Type': 'application/json' },  // تعیین نوع محتوا به صورت JSON
            body: JSON.stringify({ email, verificationCode })  // ارسال ایمیل و کد تأیید به سرور
        });
        const data = await response.json();  // تجزیه داده‌های دریافتی از سرور به فرمت JSON
        alert(data.message);  // نمایش پیام دریافت‌شده از سرور به کاربر
    };

    // تابع برای پرتاب تاس
    const rollDice = async () => {
        const email = prompt("Enter your email:");  // درخواست ایمیل از کاربر
        const response = await fetch('http://localhost:3000/roll-dice', {  // ارسال درخواست POST برای پرتاب تاس
            method: 'POST',  // مشخص کردن متد POST
            headers: { 'Content-Type': 'application/json' },  // تعیین نوع محتوا به صورت JSON
            body: JSON.stringify({ email })  // ارسال ایمیل کاربر به سرور
        });
        const data = await response.json();  // تجزیه داده‌های دریافتی از سرور به فرمت JSON

        if (response.ok) {  // اگر درخواست موفقیت‌آمیز بود
            alert(`Dice rolled: ${data.dice.join(', ')}. You earned ${data.pointsEarned} points.`);  // نمایش نتیجه پرتاب تاس و امتیاز کسب‌شده
            setTotalScore(data.totalScore);  // به‌روزرسانی نمره کل بازیکن
            setClaimedRewards(data.claimedRewards);  // به‌روزرسانی تعداد جوایز دریافت‌شده
            setShowClaimButton(data.totalScore >= 200);  // اگر نمره کل بیشتر از یا برابر ۲۰۰ باشد، دکمه "Claim Rewards" نمایش داده می‌شود
        } else {
            alert(data.message || "An error occurred while rolling dice.");  // در صورت بروز خطا، نمایش پیام خطا
        }
    };

    // تابع برای دریافت جوایز
    const claimRewards = async () => {
        const email = prompt("Enter your email:");  // درخواست ایمیل از کاربر
        const response = await fetch('http://localhost:3000/claim', {  // ارسال درخواست POST برای دریافت جوایز
            method: 'POST',  // مشخص کردن متد POST
            headers: { 'Content-Type': 'application/json' },  // تعیین نوع محتوا به صورت JSON
            body: JSON.stringify({ email })  // ارسال ایمیل کاربر به سرور
        });

        const data = await response.json();  // تجزیه داده‌های دریافتی از سرور به فرمت JSON

        if (response.ok) {  // اگر درخواست موفقیت‌آمیز بود
            alert(data.message);  // نمایش پیام دریافت‌شده از سرور به کاربر
            setTotalScore(data.totalScore);  // به‌روزرسانی نمره کل بازیکن
            setClaimedRewards(data.claimedRewards);  // به‌روزرسانی تعداد جوایز دریافت‌شده
        } else {
            alert(data.message || "An error occurred while claiming rewards.");  // در صورت بروز خطا، نمایش پیام خطا
        }
    };

    // تابع برای مشاهده جدول رده‌بندی
    const viewLeaderboard = async () => {
        try {
            const response = await fetch('http://localhost:3000/leaderboard', {  // ارسال درخواست GET برای دریافت جدول رده‌بندی
                method: 'GET',  // مشخص کردن متد GET
                headers: { 'Content-Type': 'application/json' },  // تعیین نوع محتوا به صورت JSON
            });

            const data = await response.json();  // تجزیه داده‌های دریافتی از سرور به فرمت JSON

            if (!response.ok) {  // اگر درخواست با خطا مواجه شد
                return alert(data.message || "Failed to fetch leaderboard.");  // نمایش پیام خطا
            }

            setLeaderboard(data.leaderboard);  // به‌روزرسانی وضعیت جدول رده‌بندی
        } catch (error) {
            console.error("Error fetching leaderboard:", error);  // ثبت خطا در کنسول
            alert("An error occurred while fetching the leaderboard.");  // نمایش پیام خطا به کاربر
        }
    };

    return (
        <div className="App">
            <h1>Dice Game</h1>
            <div className="buttons">
                <button onClick={register}>Register</button>
                <button onClick={login}>Login</button>
                <button onClick={rollDice}>Roll Dice</button>
                {showClaimButton && <button onClick={claimRewards}>Claim Rewards</button>}
            </div>
            <div className="score">
                <p>Total Score: {totalScore}</p>
             </div>
            <button onClick={viewLeaderboard}>View Leaderboard</button>
            {leaderboard.length > 0 && (
                <div className="leaderboard">
                    <table>
                        <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Email</th>
                            <th>Score</th>
                        </tr>
                        </thead>
                        <tbody>
                        {leaderboard.map((player, index) => (
                            <tr key={player.email}>
                                <td>{index + 1}</td>  {/* رتبه بازیکن */}
                                <td>{player.email}</td>  {/* ایمیل بازیکن */}
                                <td>{player.score}</td>  {/* نمره بازیکن */}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default App;

