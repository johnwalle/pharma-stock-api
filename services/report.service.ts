import MedicineSale from '../models/sell.model';
import Medicine from '../models/medicine.model';
import { getDateRange } from '../utils/dateRange';

export const getReports = async (range: string) => {
  const { start, end } = getDateRange(range);

  // Low Stock + Out of Stock
  const lowStockCount = await Medicine.countDocuments({ status: 'low-stock', isDeleted: false });
  const outOfStockCount = await Medicine.countDocuments({ status: 'out-of-stock', isDeleted: false });

  // KPI: Total Sales and Total Sold Value
  const salesWithPrices = await MedicineSale.aggregate([
    {
      $match: {
        soldAt: { $gte: start, $lte: end }
      }
    },
    {
      $lookup: {
        from: 'medicines',
        localField: 'medicineId',
        foreignField: '_id',
        as: 'medicineInfo'
      }
    },
    {
      $unwind: '$medicineInfo'
    },
    {
      $project: {
        quantitySold: 1,
        pricePerUnit: '$medicineInfo.pricePerUnit'
      }
    }
  ]);

  const totalSales = salesWithPrices.reduce((acc, sale) => acc + sale.quantitySold, 0);
  const soldValue = salesWithPrices.reduce(
    (acc, sale) => acc + sale.quantitySold * sale.pricePerUnit,
    0
  );

  // Trend Data (grouped by day)
  const trend = await MedicineSale.aggregate([
    {
      $match: {
        soldAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$soldAt'
          }
        },
        totalQuantity: { $sum: '$quantitySold' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Top Sellers with Revenue
  const topSellers = await MedicineSale.aggregate([
    {
      $match: {
        soldAt: { $gte: start, $lte: end }
      }
    },
    {
      $lookup: {
        from: 'medicines',
        localField: 'medicineId',
        foreignField: '_id',
        as: 'medicineInfo'
      }
    },
    {
      $unwind: '$medicineInfo'
    },
    {
      $group: {
        _id: '$medicineInfo.brandName',
        quantitySold: { $sum: '$quantitySold' },
        revenue: { $sum: { $multiply: ['$quantitySold', '$medicineInfo.pricePerUnit'] } }
      }
    },
    {
      $sort: { quantitySold: -1 }
    },
    {
      $limit: 5
    },
    {
      $project: {
        brandName: '$_id',
        quantitySold: 1,
        revenue: 1,
        _id: 0
      }
    }
  ]);

  return {
    kpis: {
      totalSales,
      soldValue: Math.round(soldValue),
      lowStockCount,
      outOfStockCount
    },
    trend,
    topSellers
  };
};
