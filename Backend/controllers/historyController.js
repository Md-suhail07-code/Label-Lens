import { ScanHistory } from "../models/historyModel";

export const deleteSpecificHistory = async (req, res) => {
    try {
        const { historyId } = req.params;
        const history = await ScanHistory.findById(historyId);
        if (!history) {
            return res.status(404).json({
                success: false,
                message: "History item not found"
            });
        }
        await ScanHistory.findByIdAndDelete(historyId);
        return res.status(200).json({
            success: true,
            message: "History item deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        })
    }
}

export const clearAllHistory = async (req, res) => {
    try {
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
}