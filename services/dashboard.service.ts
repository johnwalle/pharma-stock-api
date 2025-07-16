// services/dashboard.service.ts

import Medicine from '../models/medicine.model';
import MedicineSale from '../models/sell.model';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';

export const getDashboardAnalyticsService = async () => {
  const today = new Date().toISOString().split('T')[0]; // "2025-07-15"


  // === OVERVIEW ===
  const totalMedicines = await Medicine.countDocuments({ isDeleted: false });
  const lowStockAlerts = await Medicine.countDocuments({
    isDeleted: false,
    status: 'low-stock',
  });
  
  // Count expired medicines
  const expiredMedicines = await Medicine.countDocuments({
    isDeleted: false,
    expiryDate: { $lt: today },
  });

  const outOfStockMedicines = await Medicine.countDocuments({
    isDeleted: false,
    status: 'out-of-stock',
  });

  const pharmacyOverview = {
    totalMedicines,
    lowStockAlerts,
    expiredMedicines,
    outOfStockMedicines,
  };

  // === TOP USED MEDICINES (based on total quantity sold) ===
  const topUsed = await MedicineSale.aggregate([
    {
      $group: {
        _id: '$medicineId',
        totalSold: { $sum: '$quantitySold' }, // Updated field name
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'medicines',
        localField: '_id',
        foreignField: '_id',
        as: 'medicine',
      },
    },
    { $unwind: '$medicine' },
    {
      $project: {
        name: '$medicine.brandName',
        count: '$totalSold',
      },
    },
  ]);

  // === STOCK STATUS PIE ===
  const [available, lowStock, outOfStock] = await Promise.all([
    Medicine.countDocuments({ status: 'available', isDeleted: false }),
    Medicine.countDocuments({ status: 'low-stock', isDeleted: false }),
    Medicine.countDocuments({ status: 'out-of-stock', isDeleted: false }),
  ]);

  const stockStatus = [
    { name: 'In Stock', value: available },
    { name: 'Low Stock', value: lowStock },
    { name: 'Out of Stock', value: outOfStock },
  ];

  // === EXPIRY TRENDS OVER 6 MONTHS ===
  const expiryTrends = [];

  for (let i = 0; i < 6; i++) {
    const start = startOfMonth(addMonths(today, i));
    const end = endOfMonth(start);

    const count = await Medicine.countDocuments({
      isDeleted: false,
      expiryDate: {
        $gte: start,
        $lte: end,
      },
    });

    expiryTrends.push({
      month: start.toLocaleString('default', { month: 'short' }),
      items: count,
    });
  }

  // === FINAL RETURN ===
  return {
    pharmacyOverview,
    charts: {
      topUsedMedicines: topUsed,
      stockStatus,
      expiryTrends,
    },
  };
};
