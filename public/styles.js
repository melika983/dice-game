let userScore = 0;

async function register() {
    const email = document.getElementById("email").value;  // گرفتن ایمیل از ورودی فرم

    if (!email) {
        alert("Please enter a valid email address.");
        return; // در صورتی که ایمیل وارد نشده باشد، پیام خطا داده می‌شود
    }

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }), // ارسال ایمیل به سرور
        });

        if (response.ok) {
            const data = await response.json();  // دریافت پاسخ از سرور
            console.log(data); // در صورت موفقیت، اطلاعات پاسخ نمایش داده می‌شود
            alert('Registration successful!'); // نمایش پیام موفقیت
        } else {
            throw new Error('Error: ' + response.statusText);  // در صورت خطا، پیام خطا نمایش داده می‌شود
        }
    } catch (error) {
        console.error('Error:', error); // برای خطاهای احتمالی
        alert('Registration failed. Please try again.');
    }
}

async function login() {
    // گرفتن ایمیل و کد تأیید از کاربر
    const email = document.getElementById("email").value; // دسترسی به فیلد ایمیل با id="email"
    const verificationCode = document.getElementById("verification-code").value; // دسترسی به فیلد کد با id="verification-code"

    if (!email || !verificationCode) {
        alert("Please enter both email and verification code.");
        return; // اگر هر کدام وارد نشده باشد، عملیات متوقف می‌شود
    }

    try {
        // ارسال درخواست به سرور
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, verificationCode }),
        });

        // پردازش پاسخ سرور
        const data = await response.json();

        if (response.ok) {
            // ذخیره توکن در localStorage
            localStorage.setItem('token', data.token);

            // نمایش پیام موفقیت
            alert(data.message);

        } else {
            // نمایش پیام خطا
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        // هندل کردن خطاهای غیرمنتظره
        console.error('Login failed:', error);
        alert('An error occurred. Please try again later.');
    }
}




async function rollDice() {
    let email = localStorage.getItem('email'); // بررسی وجود ایمیل در localStorage

    // دریافت ایمیل جدید از فرم (اگر موجود باشد)
    const currentEmail = document.getElementById("email") ? document.getElementById("email").value : null; // بررسی اینکه آیا فیلد ایمیل موجود است

    // اگر ایمیل جدید وارد شده باشد، آن را ذخیره می‌کنیم
    if (currentEmail && email !== currentEmail) {
        email = currentEmail; // ایمیل جدید دریافت شده
        localStorage.setItem('email', email); // ذخیره ایمیل جدید در localStorage
    }

    // اگر ایمیلی در localStorage نباشد، از کاربر می‌خواهیم ایمیل وارد کند
    if (!email) {
        email = prompt("Enter your email:");
        if (!email) {
            alert("You must enter an email to roll the dice.");
            return; // اگر ایمیل وارد نشود، تابع متوقف می‌شود
        }
        localStorage.setItem('email', email); // ذخیره ایمیل در localStorage
    }

    // ارسال درخواست به سرور
    const response = await fetch('/roll-dice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (response.ok) {
        // اگر درخواست موفق بود، اطلاعات نمایش داده می‌شوند
        document.getElementById("dice-result").textContent = `Dice rolled: ${data.dice.join(', ')}. You earned ${data.pointsEarned} points.`; // نمایش نتیجه در تگ h1
        const userScore = data.totalScore;
        document.getElementById("total-score").textContent = userScore;

        // نمایش یا پنهان کردن دکمه "Claim" بر اساس امتیاز
        if (userScore >= 200) {
            document.getElementById("claim-button").style.display = "block";
        } else {
            document.getElementById("claim-button").style.display = "none";
        }
    } else {
        // اگر درخواست ناموفق بود، پیام خطا نمایش داده می‌شود
        document.getElementById("dice-result").textContent = data.message || "An error occurred while rolling dice.";
    }
}
function logout() {
    // حذف ایمیل و توکن از localStorage
    localStorage.removeItem('email');
    localStorage.removeItem('token');

    // هدایت به صفحه لاگین یا صفحه دلخواه
    window.location.href = '/login.html';  // یا هر صفحه‌ای که بخواهید هدایت کنید
}
// بررسی ورود کاربر
window.onload = function() {
    const email = localStorage.getItem('email');
    if (email) {
        // اگر ایمیل وجود داشت، دکمه logout را نمایش می‌دهیم
        document.getElementById("logout-button").style.display = "block";
    } else {
        // اگر ایمیل وجود نداشت، دکمه logout نمایش داده نمی‌شود
        document.getElementById("logout-button").style.display = "none";
    }
}


// نمایش مدال برای وارد کردن ایمیل
async function claimRewards() {
    document.getElementById("modal").style.display = "block";
}

// بستن مدال
function closeModal() {
    document.getElementById("modal").style.display = "none";
}

// ارسال ایمیل و دریافت نتیجه از سرور


async function submitEmail() {
    const email = document.getElementById("modal-email").value; // Get email from modal
    const modalResponse = document.getElementById("modal-response"); // Get response element

    // Check if modalResponse exists
    if (!modalResponse) {
        console.error("Modal response element not found.");
        return;
    }

    if (!email) {
        modalResponse.textContent = "Please enter a valid email.";
        return;
    }

    try {
        const response = await fetch('/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
            modalResponse.textContent = `${data.message}.`;
            const totalScoreElement = document.getElementById("total-score");
            const claimedRewardsElement = document.getElementById("claimed-rewards");

            if (totalScoreElement) {
                totalScoreElement.textContent = data.totalScore;
            } else {
                console.error("Total score element not found.");
            }

            if (claimedRewardsElement) {
                claimedRewardsElement.textContent = data.claimedRewards;
            } else {
                console.error("Claimed rewards element not found.");
            }

         } else {
            modalResponse.textContent = data.message || "An error occurred while claiming rewards.";
        }
    } catch (error) {
        modalResponse.textContent = "Unexpected error. Please try again later.";
        console.error('Error while claiming rewards:', error);
    }
}
async function viewLeaderboard() {
    try {
        const response = await fetch('/leaderboard', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        if (!response.ok) {
            return alert(data.message || "Failed to fetch leaderboard.");
        }

        // گرفتن عنصر کانتینر لیدربورد از DOM
        let leaderboardContainer = document.getElementById("leaderboard-container");
        leaderboardContainer.innerHTML = ""; // پاک کردن محتوای قبلی

        // ساخت جدول
        const table = document.createElement("table");
        table.setAttribute("border", "1"); // اضافه کردن خطوط جدول
        table.style.width = "100%";
        table.style.textAlign = "center";

        const headerRow = document.createElement("tr");

        // افزودن هدر جدول
        headerRow.innerHTML = `
            <th>Rank</th>
            <th>Email</th>
            <th>Score</th>
        `;
        table.appendChild(headerRow);

        // افزودن ردیف‌های بازیکنان
        data.leaderboard.forEach((player) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${player.rank}</td>
                <td>${player.email}</td>
                <td>${player.score}</td>
            `;
            table.appendChild(row);
        });

        // اضافه کردن جدول به کانتینر
        leaderboardContainer.appendChild(table);
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        alert("An error occurred while fetching the leaderboard.");
    }
}