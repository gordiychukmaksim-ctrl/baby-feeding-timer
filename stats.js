// Statistics and Analytics Module
class FeedingStats {
    constructor() {
        this.history = [];
    }

    setHistory(history) {
        this.history = history;
    }

    // Calculate average feeding duration
    getAverageDuration() {
        if (this.history.length === 0) return 0;

        const total = this.history.reduce((sum, feeding) => sum + feeding.duration, 0);
        return Math.floor(total / this.history.length);
    }

    // Get total feeding time for today
    getTodayTotal() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayFeedings = this.history.filter(feeding => {
            const feedingDate = new Date(feeding.timestamp);
            feedingDate.setHours(0, 0, 0, 0);
            return feedingDate.getTime() === today.getTime();
        });

        return todayFeedings.reduce((sum, feeding) => sum + feeding.duration, 0);
    }

    // Get feeding count for today
    getTodayCount() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.history.filter(feeding => {
            const feedingDate = new Date(feeding.timestamp);
            feedingDate.setHours(0, 0, 0, 0);
            return feedingDate.getTime() === today.getTime();
        }).length;
    }

    // Get feedings grouped by day (last 7 days)
    getWeeklyData() {
        const days = [];
        const counts = [];
        const durations = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const dayFeedings = this.history.filter(feeding => {
                const feedingDate = new Date(feeding.timestamp);
                feedingDate.setHours(0, 0, 0, 0);
                return feedingDate.getTime() === date.getTime();
            });

            const dayName = date.toLocaleDateString('uk-UA', { weekday: 'short' });
            days.push(dayName);
            counts.push(dayFeedings.length);

            const totalDuration = dayFeedings.reduce((sum, f) => sum + f.duration, 0);
            durations.push(Math.floor(totalDuration / 60000)); // Convert to minutes
        }

        return { days, counts, durations };
    }

    // Get side distribution
    getSideDistribution() {
        const leftCount = this.history.filter(f => f.side === 'left').length;
        const rightCount = this.history.filter(f => f.side === 'right').length;

        return {
            left: leftCount,
            right: rightCount,
            leftPercent: this.history.length > 0 ? Math.round((leftCount / this.history.length) * 100) : 50,
            rightPercent: this.history.length > 0 ? Math.round((rightCount / this.history.length) * 100) : 50
        };
    }

    // Get average time between feedings
    getAverageInterval() {
        if (this.history.length < 2) return 0;

        let totalInterval = 0;
        for (let i = 0; i < this.history.length - 1; i++) {
            const current = new Date(this.history[i].timestamp);
            const next = new Date(this.history[i + 1].timestamp);
            totalInterval += (next - current);
        }

        return Math.floor(totalInterval / (this.history.length - 1));
    }

    // Get longest feeding
    getLongestFeeding() {
        if (this.history.length === 0) return null;

        return this.history.reduce((longest, current) => {
            return current.duration > longest.duration ? current : longest;
        });
    }

    // Get shortest feeding
    getShortestFeeding() {
        if (this.history.length === 0) return null;

        return this.history.reduce((shortest, current) => {
            return current.duration < shortest.duration ? current : shortest;
        });
    }

    // Export data as CSV
    exportToCSV() {
        if (this.history.length === 0) {
            return 'Дата,Час,Тривалість (хв),Сторона,Нотатки\n';
        }

        const header = 'Дата,Час,Тривалість (хв),Сторона,Нотатки\n';

        const rows = this.history.map(feeding => {
            const date = new Date(feeding.timestamp);
            const dateStr = date.toLocaleDateString('uk-UA');
            const timeStr = date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
            const durationMin = Math.floor(feeding.duration / 60000);
            const durationSec = Math.floor((feeding.duration % 60000) / 1000);
            const duration = `${durationMin}:${durationSec.toString().padStart(2, '0')}`;
            const side = feeding.side === 'left' ? 'Ліва' : 'Права';
            const notes = feeding.notes || '';

            return `${dateStr},${timeStr},${duration},${side},"${notes}"`;
        }).join('\n');

        return header + rows;
    }

    // Download CSV file
    downloadCSV() {
        const csv = this.exportToCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const now = new Date();
        const filename = `feeding-history-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Share data
    async shareData() {
        const csv = this.exportToCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const file = new File([blob], 'feeding-history.csv', { type: 'text/csv' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Історія годування',
                    text: 'Історія годування немовляти'
                });
                return true;
            } catch (err) {
                console.log('Share failed:', err);
                return false;
            }
        }
        return false;
    }
}

// Export singleton instance
const feedingStats = new FeedingStats();
