import MedicineSale from '../models/sell.model';
import Medicine from '../models/medicine.model';
import { getDateRange } from '../utils/dateRange';

export const getReports = async (range: string) => {
  const { start, end } = getDateRange(range);

  // Low Stock + Out of Stock
  const lowStockCount = await Medicine.countDocuments({ status: 'low-stock', isDeleted: false });
  const outOfStockCount = await Medicine.countDocuments({ status: 'out-of-stock', isDeleted: false });

  // KPI: Total Sales (units sold), Total Revenue, Total Profit
  const salesAgg = await MedicineSale.aggregate([
    { $match: { soldAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        totalUnitsSold: { $sum: '$quantitySold' },
        totalRevenue: { $sum: { $multiply: ['$quantitySold', '$sellingPrice'] } },
        totalProfit: { $sum: '$profit' },
      },
    },
  ]);

  const totalUnitsSold = salesAgg[0]?.totalUnitsSold || 0;
  const totalRevenue = salesAgg[0]?.totalRevenue || 0;
  const totalProfit = salesAgg[0]?.totalProfit || 0;

  // Trend Data (grouped by day)
  const trend = await MedicineSale.aggregate([
    { $match: { soldAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$soldAt' } },
        unitsSold: { $sum: '$quantitySold' },
        revenue: { $sum: { $multiply: ['$quantitySold', '$sellingPrice'] } },
        profit: { $sum: '$profit' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Full list of sold medicines in the range
  const soldMedicines = await MedicineSale.aggregate([
    { $match: { soldAt: { $gte: start, $lte: end } } },
    {
      $lookup: {
        from: 'medicines',
        localField: 'medicineId',
        foreignField: '_id',
        as: 'medicineInfo',
      },
    },
    { $unwind: '$medicineInfo' },
    {
      $project: {
        _id: 0,
        brandName: 1,
        genericName: '$medicineInfo.genericName',
        batchNumber: 1,
        strength: '$medicineInfo.strength',
        sellingPrice: 1,
        purchaseCost: '$medicineInfo.purchaseCost',
        quantitySold: 1,
        revenue: { $multiply: ['$quantitySold', '$sellingPrice'] },
        profit: 1,
        soldAt: 1,
      },
    },
    { $sort: { soldAt: -1 } }, // latest sales first
  ]);

  return {
    kpis: {
      totalUnitsSold,
      totalRevenue: Math.round(totalRevenue),
      totalProfit: Math.round(totalProfit),
      lowStockCount,
      outOfStockCount,
    },
    trend,
    soldMedicines, // full list for report generation
  };
};
