'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

export default function ContributionGraph() {
    const [activityData, setActivityData] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getStudyActivity()
            .then(setActivityData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const weeks = useMemo(() => {
        const data = [];
        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setDate(today.getDate() - 364); // approx 52 weeks

        // Iterate by weeks
        let currentDate = new Date(oneYearAgo);
        // Align to Sunday/Monday? Let's just do 52 columns of 7 days

        for (let w = 0; w < 52; w++) {
            const week = [];
            for (let d = 0; d < 7; d++) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const count = activityData[dateStr] || 0;

                let level = 0;
                if (count > 8) level = 4;
                else if (count > 5) level = 3;
                else if (count > 2) level = 2;
                else if (count > 0) level = 1;

                week.push({ level, date: dateStr, count });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            data.push(week);
        }
        return data;
    }, [activityData]);

    const getColor = (level: number) => {
        switch (level) {
            case 1: return 'bg-emerald-900/50';
            case 2: return 'bg-emerald-700/60';
            case 3: return 'bg-emerald-500/70';
            case 4: return 'bg-emerald-400';
            default: return 'bg-slate-800/50';
        }
    };

    return (
        <div className="w-full bg-slate-900/30 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-200">Study Activity</h3>
                <div className="text-xs text-slate-500">Last 365 Days</div>
            </div>

            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
                {weeks.map((week, wIndex) => (
                    <div key={wIndex} className="flex flex-col gap-1">
                        {week.map((day, dIndex) => (
                            <motion.div
                                key={dIndex}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: (wIndex * 7 + dIndex) * 0.001 }}
                                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-sm ${getColor(day.level)}`}
                                title={`${day.date}: ${day.count} lessons completed`}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-end gap-2 mt-2 text-xs text-slate-500">
                <span>Less</span>
                <div className="w-2 h-2 rounded-sm bg-slate-800/50" />
                <div className="w-2 h-2 rounded-sm bg-emerald-900/50" />
                <div className="w-2 h-2 rounded-sm bg-emerald-700/60" />
                <div className="w-2 h-2 rounded-sm bg-emerald-500/70" />
                <div className="w-2 h-2 rounded-sm bg-emerald-400" />
                <span>More</span>
            </div>
        </div>
    );
}
