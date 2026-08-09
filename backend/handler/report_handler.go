package handler

import (
	"queue-care-backend/errors"
	"queue-care-backend/repository"

	"github.com/gofiber/fiber/v2"
)

func GetMyReports(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	reports, err := repository.GetReportsByUserID(userID)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "DB_ERROR", err.Error())
	}

	return c.JSON(reports)
}

func GetReportDetails(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	reportID := c.Params("id")

	report, err := repository.GetReportByID(reportID, userID)
	if err != nil {
		return errors.SendError(c, fiber.StatusInternalServerError, "DB_ERROR", err.Error())
	}

	if report == nil {
		return errors.SendError(c, fiber.StatusNotFound, "NOT_FOUND", "Report not found or access denied")
	}

	return c.JSON(report)
}
