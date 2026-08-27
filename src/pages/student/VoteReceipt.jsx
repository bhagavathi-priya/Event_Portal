import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReceiptQuery } from '../../hooks/queries/useReceiptQuery';
import { PageTransition } from '../../components/motion/PageTransition';
import { motion, useReducedMotion } from 'framer-motion';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = date.getDate();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');
  return `${hoursStr}:${minutes}:${seconds} ${ampm}`;
};

export const VoteReceipt = () => {
  const { receiptId } = useParams();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const { data: receiptRes, isLoading, isError } = useReceiptQuery(receiptId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-455 text-sm">Retrieving vote receipt...</p>
      </div>
    );
  }

  if (isError || !receiptRes?.success) {
    return (
      <div className="text-center py-12">
        <div className="text-rose-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Receipt Not Found</h2>
        <p className="text-slate-500 dark:text-slate-455 mt-1">
          The requested transaction receipt could not be resolved.
        </p>
        <button
          onClick={() => navigate('/student/dashboard')}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200 outline-none"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const receipt = receiptRes.data;

  const handleDownload = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Official Ballot Receipt - ${receipt.id}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;850;900&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #ffffff;
      color: #0f172a;
    }
  </style>
</head>
<body class="flex justify-center items-start min-h-screen py-10 px-6 bg-white">
  <div class="w-full max-w-2xl bg-white">
    <!-- Header Section -->
    <div class="pb-6 border-b border-slate-200">
      <span class="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Campus Ledger System</span>
      <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Official Ballot Receipt</h1>
    </div>

    <!-- Content Table -->
    <div class="py-8 space-y-6">
      <p class="text-sm text-slate-500 leading-relaxed">
        This document serves as the official transaction confirmation for your ballot. It has been securely logged on the campus election node.
      </p>

      <div class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
        <table class="w-full text-sm text-left border-collapse">
          <tbody>
            <tr class="border-b border-slate-200">
              <td class="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[11px] w-1/3 bg-slate-100/50">Receipt ID</td>
              <td class="px-6 py-4 font-mono font-bold text-slate-800 break-all select-all">${receipt.id}</td>
            </tr>
            <tr class="border-b border-slate-200">
              <td class="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[11px] bg-slate-100/50">Voter ID</td>
              <td class="px-6 py-4 font-mono font-bold text-slate-800">${receipt.studentId}</td>
            </tr>
            <tr class="border-b border-slate-200">
              <td class="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[11px] bg-slate-100/50">Election Category</td>
              <td class="px-6 py-4 font-bold text-slate-800">${receipt.categoryName}</td>
            </tr>
            <tr class="border-b border-slate-200">
              <td class="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[11px] bg-slate-100/50">Date Issued</td>
              <td class="px-6 py-4 font-semibold text-slate-800">${formatDate(receipt.issuedAt)}</td>
            </tr>
            <tr>
              <td class="px-6 py-4 font-semibold text-slate-500 uppercase tracking-wider text-[11px] bg-slate-100/50">Time Logged</td>
              <td class="px-6 py-4 font-semibold text-slate-800">${formatTime(receipt.issuedAt)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ballot-receipt-${receipt.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const receiptVariants = {
    hidden: { 
      opacity: 0, 
      scale: shouldReduceMotion ? 1 : 0.95,
      y: shouldReduceMotion ? 0 : 30 
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        duration: shouldReduceMotion ? 0.05 : 0.6,
        bounce: 0.15
      }
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center space-y-6 max-w-lg mx-auto py-8">
        
        {/* Animated Checkmark and Success Header */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: shouldReduceMotion ? 1 : 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: shouldReduceMotion ? 0 : 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 border border-emerald-205 dark:border-emerald-900 shadow-md"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-3">
            Vote Confirmed!
          </h1>
          <p className="text-xs text-slate-500">
            Thank you for casting your vote. Your ballot has been cryptographically signed and secured.
          </p>
        </div>

        {/* Printable Receipt Card */}
        <motion.div
          id="receipt-card"
          initial="hidden"
          animate="visible"
          variants={receiptVariants}
          className="w-full bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden print:border-none print:shadow-none"
        >
          {/* Top dotted border styling */}
          <div className="h-2 bg-indigo-600" />

          <div className="p-6 sm:p-8 space-y-6">
            {/* Header / Receipt details */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                  Official Ballot Receipt
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Transaction Verified
                </h2>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-805 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 uppercase font-mono">
                Receipt
              </span>
            </div>

            {/* Dotted separator line */}
            <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />

            {/* Data items */}
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-450 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Receipt ID
                </span>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  {receipt.id}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-450 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Voter ID
                </span>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  {receipt.studentId}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-450 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Category
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {receipt.categoryName}
                </span>
              </div>


              <div className="flex justify-between items-center">
                <span className="text-slate-450 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Date
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {formatDate(receipt.issuedAt)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-450 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Time
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {formatTime(receipt.issuedAt)}
                </span>
              </div>
            </div>

            {/* Dotted separator line */}
            <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />

            {/* Verification Hash / Security details */}
            <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-3 border border-slate-100 dark:border-slate-850 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Ballot Status
                </h4>
                <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-normal">
                  Recorded on Campus Ledger.
                </p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full print:hidden">
          <button
            onClick={() => {
              let clubId = 'coding';
              if (receipt?.parentId) {
                clubId = receipt.parentId;
              } else if (receipt?.categoryId?.startsWith('cult-cat-')) {
                clubId = 'cultural';
              }
              navigate('/student/dashboard', { state: { selectedClubId: clubId } });
            }}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-900/25 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none text-center"
          >
            Dashboard
          </button>
          
          <button
            onClick={handleDownload}
            className="py-2.5 px-4 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-750 dark:text-slate-300 text-slate-700 border border-slate-250 dark:border-slate-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      </div>
    </PageTransition>
  );
};

export default VoteReceipt;
