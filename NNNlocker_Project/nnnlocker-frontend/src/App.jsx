import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
// import './App.css'; // We no longer need this

// --- Configuration ---

// From PRD Section 3: Motivational Video System
const motivationalVideos = [
  "https://youtu.be/kDgVEjvnxu8?si=wgQO5Vk8VsHZwIGG", // 1. Discipline over Motivation
  "https://youtu.be/B2iS-bwWkxM?si=-jZC124YlHTenTKu", // 2. No More Excuses
  "https://youtu.be/3ZJQ7ey4a80?si=9RabXPdseU5A0x6-", // 3. Pain = Progress
  "https://youtu.be/MkAkZs9f3p8?si=5GWZUsxdiRdSuuW0", // 4. The Comeback Mindset
  "https://youtu.be/ZBCW9IYgAEQ?si=jQq-N55VOfoTvQAq", // 5. Stay Unbroken
  "https://youtu.be/BIG1WF6SZDY?si=Xhn4wSd4ZBrzw3uH"  // 6. You Still Have Time
];

// Backend API URLs
const API_URL = "http://127.0.0.1:5000";
const GET_STATS_URL = `${API_URL}/get-stats`;
const FAIL_EVENT_URL = `${API_URL}/fail-event`;
const LOG_SUCCESS_URL = `${API_URL}/log-success`;
const COACH_URL = `${API_URL}/coach/message`;

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Default structure for our chart state
const initialChartData = {
  labels: [],
  datasets: [
    {
      label: 'Fails per Day',
      data: [],
      backgroundColor: 'rgba(239, 68, 68, 0.6)', // Red for fails
      borderColor: 'rgb(239, 68, 68)',
      borderWidth: 1,
    },
  ],
};

// New Chart options for a dark theme
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#e5e7eb' // text-gray-200
      }
    },
    title: {
      display: false,
    }
  },
  scales: {
    y: {
      ticks: {
        color: '#9ca3af', // text-gray-400
        stepSize: 1,
      },
      grid: {
        color: '#4b5563' // text-gray-700
      },
      beginAtZero: true
    },
    x: {
      ticks: {
        color: '#9ca3af' // text-gray-400
      },
      grid: {
        color: '#4b5563' // text-gray-700
      }
    }
  }
};


function App() {
  // --- State ---
  const [streakDays, setStreakDays] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [chartData, setChartData] = useState(initialChartData);
  
  const [coachReply, setCoachReply] = useState("Your AI Coach is ready.");
  const [userInput, setUserInput] = useState("");

  // --- Data Fetching ---
  
  /**
   * Fetches all stats from the backend and updates the UI.
   * This is now our single source of truth.
   */
  const fetchStats = async () => {
    try {
      const response = await fetch(GET_STATS_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      setStreakDays(data.streakDays);
      setFailCount(data.failCount);
      
      // Update chart data
      setChartData({
        labels: data.chart.labels,
        datasets: [
          {
            ...initialChartData.datasets[0],
            data: data.chart.data,
          },
        ],
      });
      
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  // Load stats from the database when the app first loads
  useEffect(() => {
    fetchStats();
  }, []); // The empty array [] means this runs once on mount.

  
  // --- Core Logic (FIXED) ---

  const handleFail = async () => {
    // 1. Determine video based on the *current* state.
    const nextFailCount = failCount + 1;
    const videoIndex = (nextFailCount - 1) % motivationalVideos.length;
    const nextVideoUrl = motivationalVideos[videoIndex];

    // 2. Open the video
    window.open(nextVideoUrl, '_blank');
    alert("Motivation blast incoming! Go full-screen on the new tab and lock in.");

    // 3. OPTIMISTIC UI UPDATE:
    setFailCount(nextFailCount);
    setStreakDays(0);
    
    // 4. Log the fail event to the backend
    try {
      await fetch(FAIL_EVENT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: "User manual fail report",
          video_url: nextVideoUrl
        }),
      });
      
      // 5. Refresh all dashboard data from the DB
      await fetchStats();

    } catch (error) {
      console.error("Failed to log fail event:", error);
      fetchStats(); // Re-fetch to get the "real" data
    }

    // 6. Ask coach for reflection
    askCoach("I failed just now.");
  };
  
  /**
   * Logs a successful day and refreshes stats.
   */
  const handleSuccess = async () => {
    // Optimistic update
    setStreakDays(streakDays + 1);

    try {
      await fetch(LOG_SUCCESS_URL, {
        method: 'POST',
      });
      
      // Refresh all dashboard data from the DB
      await fetchStats();
      
    } catch (error) {
      console.error("Failed to log success:", error);
    }
  };

  // --- AI Coach (Section 6) ---
  const askCoach = async (message) => {
    setCoachReply("Coach is thinking...");
    try {
      const response = await fetch(COACH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: message,
          streak: streakDays // Send the current streak
        }),
      });
      const data = await response.json();
      setCoachReply(data.coach_reply);
    } catch (error) {
      console.error("Failed to reach AI coach:", error);
      setCoachReply("Error connecting to coach. Is Ollama running?");
    }
  };

  const handleCoachSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    askCoach(userInput);
    setUserInput("");
  };

  // --- Render JSX ---
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* --- Header --- */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">NNNlocker <span className="text-blue-400">v1.0</span></h1>
          <p className="text-lg md:text-xl text-gray-400 italic">“Stay focused, stay strong — because willpower deserves a dashboard.”</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* --- Left Column: Tracker & Coach --- */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* --- Module A: Challenge Tracker --- */}
            <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-white border-b border-gray-700 pb-2">Challenge Tracker</h2>
              <div className="grid grid-cols-2 gap-4 text-center mb-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <span className="text-5xl font-bold text-blue-400">{streakDays}</span>
                  <p className="text-sm text-gray-400">Streak Days</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <span className="text-5xl font-bold text-red-400">{failCount}</span>
                  <p className="text-sm text-gray-400">Total Lapses</p>
                </div>
              </div>
              <div className="flex flex-col space-y-3">
                <button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-md"
                  onClick={handleFail}
                >
                  Log a Relapse / Fail
                </button>
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-md"
                  onClick={handleSuccess}
                >
                  Completed a Day
                </button>
              </div>
            </section>

            {/* --- Module C: AI Accountability Coach --- */}
            <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-white border-b border-gray-700 pb-2">AI Accountability Coach</h2>
              <div className="bg-gray-900 rounded-lg p-4 min-h-[100px] mb-4 shadow-inner">
                <p className="text-gray-300">
                  <strong className="text-blue-400">Coach:</strong> {coachReply}
                </p>
              </div>
              <form onSubmit={handleCoachSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Talk to your coach..."
                  className="flex-grow bg-gray-700 border border-gray-600 text-gray-200 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  type="submit"
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-md"
                >
                  Send
                </button>
              </form>
            </section>
          </div>

          {/* --- Right Column: Analytics --- */}
          <div className="lg:col-span-2">
            <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-white border-b border-gray-700 pb-2">Willpower Analytics</h2>
              <div className="h-[400px] md:h-[500px] relative">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </section>
          </div>

        </main>
      </div>
    </div>
  );
}

export default App;

