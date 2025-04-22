import { FC, useState } from 'react';

import { Box, useTheme } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  ChartOptions,
  ChartData,
  ScriptableContext,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  annotationPlugin
);

const DailyAmountPaidChart: FC = () => {
  const theme = useTheme();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const labels = [
    '01/02',
    '02/02',
    '03/02',
    '04/02',
    '05/02',
    '06/02',
    '07/02',
  ];

  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        data: [320, 780, 680, 880, 780, 1180, 970, 1300, 1180],
        borderColor: theme.palette.text.primary,
        borderWidth: 2,
        backgroundColor: (context: ScriptableContext<'line'>) => {
          const chart = context.chart;
          const { ctx } = chart;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0.3, 'rgba(202, 207, 232, 0.3)');
          gradient.addColorStop(1, 'rgba(233, 236, 255, 0)');
          return gradient;
        },
        tension: 0.3,
        fill: true,
        pointRadius: 0,
        pointBackgroundColor: theme.palette.primary.violet,
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointHitRadius: 10,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: theme.palette.primary.violet,
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 2,
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
            const value = context.raw;
            return `${value} HMT`;
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
        max: 1600,
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
      width="75%"
      height="100%"
      bgcolor="background.default"
      overflow="hidden"
    >
      <Line data={data} options={options} />
    </Box>
  );
};

export default DailyAmountPaidChart;
