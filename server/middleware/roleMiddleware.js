const employeeOnlyOwnData = (req, res, next) => {
    if (req.user.role === 'employee') {
        // Employees can only access their own data
        req.filterByEmployee = req.user.id;
    }
    next();
};

const restrictContactsAccess = (req, res, next) => {
    if (req.user.role === 'employee') {
        return res.status(403).json({ 
            message: 'Access denied. Contacts module is restricted to Admin only.',
            redirect: '/dashboard'
        });
    }
    next();
};

module.exports = { employeeOnlyOwnData, restrictContactsAccess };
