import Account from "../models/Account.js";

export const createAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, type, balance, currency = "USD" } = req.body;

    const account = new Account({
      userId,
      name,
      type,
      balance: parseFloat(balance) || 0,
      currency,
    });

    await account.save();

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: account.getSummary(),
    });
  } catch (error) {
    console.error("Create account error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAccounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { isActive } = req.query;

    const filters = { userId };
    if (isActive !== undefined) {
      filters.isActive = isActive === "true";
    }

    const accounts = await Account.find(filters).sort({ name: 1 });

    res.json({
      success: true,
      data: accounts.map((account) => account.getSummary()),
    });
  } catch (error) {
    console.error("Get accounts error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updateData = req.body;

    // Find account and verify ownership
    const account = await Account.findOne({ _id: id, userId });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Update account
    const updatedAccount = await Account.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Account updated successfully",
      data: updatedAccount.getSummary(),
    });
  } catch (error) {
    console.error("Update account error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Find account and verify ownership
    const account = await Account.findOne({ _id: id, userId });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Note: Removed validation to allow deleting accounts with transactions
    // This allows users to delete accounts even if they have transactions

    // Delete account
    await Account.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const transferFunds = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fromAccountId, toAccountId, amount, description } = req.body;

    // Validate accounts
    const [fromAccount, toAccount] = await Promise.all([
      Account.findOne({ _id: fromAccountId, userId }),
      Account.findOne({ _id: toAccountId, userId }),
    ]);

    if (!fromAccount || !toAccount) {
      return res.status(404).json({
        success: false,
        message: "One or both accounts not found",
      });
    }

    if (fromAccountId === toAccountId) {
      return res.status(400).json({
        success: false,
        message: "Cannot transfer to the same account",
      });
    }

    if (fromAccount.balance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient funds",
      });
    }

    // Update account balances
    fromAccount.balance -= amount;
    toAccount.balance += amount;

    await Promise.all([fromAccount.save(), toAccount.save()]);

    // Create single transfer transaction
    const Transaction = (await import("../models/Transaction.js")).default;
    const currentDate = new Date();

    const transferTransaction = await new Transaction({
      userId,
      accountId: fromAccountId, // Use from account as primary
      type: "transfer",
      amount,
      description: `Transfer from ${fromAccount.name} to ${toAccount.name}: ${
        description || "Fund transfer"
      }`,
      category: "Account Transfer",
      date: currentDate,
    }).save();

    res.json({
      success: true,
      message: "Funds transferred successfully",
      data: {
        fromAccount: fromAccount.getSummary(),
        toAccount: toAccount.getSummary(),
        amount,
        transferDate: currentDate,
      },
    });
  } catch (error) {
    console.error("Transfer funds error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
