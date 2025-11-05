import { type FC, useEffect, useState } from 'react';

import { Box, useTheme } from '@mui/material';
import {
  type ChartOptions,
  type ChartData,
  type ScriptableContext,
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Line } from 'react-chartjs-2';
import { numericFormatter } from 'react-number-format';

import { formatTokenAmount } from '@/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  annotationPlugin
);

type ProcessedData = {
  date: string;
  value: number;
};

type Props = {
  data: {
    date: string;
    amount: string;
  }[];
  endDate: string;
  tokenSymbol: string;
  tokenDecimals: number;
};

const DailyAmountPaidChart: FC<Props> = ({
  data,
  endDate,
  tokenSymbol,
  tokenDecimals,
}) => {
  const theme = useTheme();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData[]>([]);

  useEffect(() => {
    const today = new Date().toISOString();
    const lastPayoutDate = data.length > 0 ? new Date(data[0].date) : endDate;

    const chartStartDate = today > endDate ? lastPayoutDate : today;

    const lastWeekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(chartStartDate);
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const processed = lastWeekDates.map((date) => {
      const foundData = data.find((item) => item.date === date);
      const [, month, day] = date.split('-');
      return {
        date: `${day}/${month}`,
        value: foundData
          ? +formatTokenAmount(foundData.amount, tokenDecimals)
          : 0,
      };
    });

    setProcessedData(processed);
  }, [data, endDate, tokenDecimals]);

  const dates = processedData.map((item) => item.date);
  const values = processedData.map((item) => item.value);

  const chartData: ChartData<'line'> = {
    labels: dates,
    datasets: [
      {
        data: values,
        borderColor: theme.palette.text.primary,
        borderWidth: 2,
        backgroundColor: (context: ScriptableContext<'line'>) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          const gradient = ctx.createLinearGradient(
            0,
            0,
            0,
            chartArea.height + 80
          );
          gradient.addColorStop(0.3, 'rgba(202, 207, 232, 0.3)');
          gradient.addColorStop(1, 'rgba(233, 236, 255, 0)');
          return gradient;
        },
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        pointBackgroundColor: theme.palette.primary.bright,
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointHitRadius: 10,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: theme.palette.primary.bright,
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 2,
        clip: false,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    onHover: (_, elements) => {
      if (elements.length > 0) {
        setHoverIndex(elements[0].index);
      } else {
        setHoverIndex(null);
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animation: {
      duration: 0,
    },
    plugins: {
      tooltip: {
        backgroundColor: theme.palette.text.primary,
        bodyColor: theme.palette.primary.light,
        bodyFont: {
          size: 16,
          weight: 500,
        },
        boxWidth: 95,
        boxHeight: 42,
        boxPadding: 6,
        usePointStyle: true,
        cornerRadius: 10,
        caretSize: 0,
        caretPadding: 10,
        displayColors: false,
        callbacks: {
          title: () => '',
          label: (context) => {
            const value = context.raw as number;
            const formattedValue = numericFormatter(value.toString(), {
              decimalScale: 2,
              fixedDecimalScale: false,
            });
            return `${formattedValue} ${tokenSymbol}`;
          },
        },
      },
      annotation: {
        annotations: {
          hoverLine: {
            type: 'line',
            xScaleID: 'x',
            xMin: hoverIndex !== null ? hoverIndex : undefined,
            xMax: hoverIndex !== null ? hoverIndex : undefined,
            borderColor: '#858ec6',
            borderWidth: 1,
            borderDash: [2, 2],
            display: hoverIndex !== null,
          },
        },
      },
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        offset: true,
        grid: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.primary,
          font: {
            size: 10,
            weight: 500,
          },
          padding: 10,
        },
      },
      y: {
        position: 'left',
        min: 0,
        max: Math.max(...values) || 1,
        grid: {
          color: 'rgba(203, 207, 230, 0.5)',
          drawTicks: false,
        },
        ticks: {
          stepSize: 200,
          color: theme.palette.text.primary,
          font: {
            size: 10,
            weight: 500,
          },
          padding: 10,
        },
        border: {
          display: false,
          dash: [2, 2],
        },
      },
    },
  };

  return (
    <Box
      width="100%"
      height="100%"
      bgcolor="background.default"
      overflow="hidden"
      onMouseLeave={() => setHoverIndex(null)}
    >
      <Line data={chartData} options={options} />
    </Box>
  );
};

export default DailyAmountPaidChart;
