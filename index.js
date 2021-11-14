// @ts-check

require('dotenv').config()
const { chromium } = require('playwright')
const { expect } = require('@playwright/test')

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  // Accedo a la web de sinergia life
  await page.goto('https://agenda.sinergialife.uy')
  // Login
  await page.fill('input[name="email"]', process.env.EMAIL)
  await page.fill('input[name="password"]', process.env.PASSWORD)
  await page.click('text=Entrar')
  // Valido acceso
  await expect(page.locator('text=Actividades').first()).toBeVisible()
  // Selecciono Funcional
  await page.click('text=Functional')
  // Valido listado de horarios
  await expect(page.locator('text=Horarios de actividades').first()).toBeVisible()

  let findAvailableActivities = true

  while (findAvailableActivities) {
    const noActivities = await page.textContent('text=No hay actividades para el día de hoy')
    // Si no hay actividades hoy, hago click en el siguiente día hasta encontrar actividades
    if (noActivities) {
      const disabledNextActivityDay = await page.$$('a.ng-hide p.activity_tomorrow_date')

      if (disabledNextActivityDay.length === 0) {
        await page.click('text=Siguiente día')
      } else {
        bookActivity(page)
        findAvailableActivities = false
      }
    } else {
      bookActivity(page)
      findAvailableActivities = false
    }
  }
  await page.screenshot({ path: 'screenshots/result.png' })

  await browser.close()
})()

const bookActivity = async page => {
  await expect(page.locator('text=Functional - All').first()).toBeVisible()
  const disabledActivity = await page.$$('a.btn.btn-primary.btn-sm.btn-card-reservar.btn-card-cancelar')

  if (disabledActivity.length === 0) {
    await page.click('.activity_card.py-2.ng-scope:nth-child(4) div.ng-scope div.px-2.col-12.row.mx-0:nth-child(5) div.col-3.col_btn_reservar.ng-scope:nth-child(4) > a.btn.btn-primary.btn-sm.btn-card-reservar.ng-binding.ng-scope')

    await expect(page.locator('text=Confirme la reserva').first()).toBeVisible()
    await expect(page.locator('text=Functional').first()).toBeVisible()

    const activityName = await (await page.$('p.activity_title')).textContent()
    const activityDate = await (await page.$('p.activity_title_date')).textContent()
    const activityTime = await (await page.$('p.activity_time')).textContent()

    await page.click('div.modal.fade.ng-scope.ng-isolate-scope.show:nth-child(1) div.modal-dialog div.modal-content div.modal-footer.py-4.ng-scope > button.btn.btn_modal_confirmar.btn-primary.btn-sm.btn-card-reservar')

    await expect(page.locator('text=Reserva realizada correctamente').first()).toBeVisible()

    console.log(`Reserva realizada para ${activityName}. Día: ${activityDate}, Horario: ${activityTime.trim()}`)
  }
}
