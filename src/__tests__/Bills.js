import { screen } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills"
import userEvent from '@testing-library/user-event'
import { ROUTES_PATH } from "../constants/routes"
import firestore from "../app/Firestore"
import Router from "../app/Router"
import { localStorageMock } from "../__mocks__/localStorage.js"
import firebase from "../__mocks__/firebase"
jest.mock('../app/Firestore');

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      // Modifier (surcharger ?) les methodes de firestore qui peuvent bloquer le test
      // mockResolvedValue renvoie une promesse
      firestore.bills = () => ({bills, get: jest.fn().mockResolvedValue()})
      // définir l'user de type employé dans le localstorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: "Employee",
      }))
      // définir la page dans le localstorage
      Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['Bills'] } })
      // créer la div root pour le fonctionnement de Router
      document.body.innerHTML = `<div id="root"></div>`
      // Lancer Router
      Router()
      // Vous pouvez maintenant faire vos tests
      const icoWindow = screen.getByTestId('icon-window')
      expect(icoWindow.classList.contains('active-icon')).toEqual(true)
    })


      test("Then bills should be ordered from earliest to latest", () => {
        const html = BillsUI({ data: bills })
        document.body.innerHTML = html
        const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => {
          return a.innerHTML
        })
        const antiChrono = (a, b) => ((a < b) ? 1 : -1)
        const datesSorted = [...dates].sort(antiChrono)
        expect(dates).toEqual(datesSorted)
      })

      // modif fab
      test("Then loading is true", () => {
        const html = BillsUI({ data: [],loading:true })
        document.body.innerHTML = html
        const loadingElt = document.getElementById('loading')
        expect(loadingElt).not.toEqual(null)
      })

      test("Then employee are on error page", () => {
        const html = BillsUI({ data: [],error:true })
        document.body.innerHTML = html
        const message = screen.getByTestId('error-message')
        expect(message).toBeTruthy()
      })

      test('Then click on buttonNewBill',()=>{
      let nextRoute = null
      const html = BillsUI({ data: [] })
      document.body.innerHTML = `<div id="root'>${html}</div>`
      const billsContainer = new Bills({
        document: document, onNavigate: (route) => nextRoute = route
      })
      const handleNewBill = jest.fn((e) => billsContainer.handleClickNewBill(e))
      const buttonNewBill = screen.getByTestId('btn-new-bill')
      buttonNewBill.addEventListener('click', handleNewBill)
      userEvent.click(buttonNewBill)
      expect(handleNewBill).toHaveBeenCalled()
      expect(nextRoute).toEqual(ROUTES_PATH['NewBill'])
    })

    test('Then click on icon-eye',()=>{
      let modalIsOpen = false
      const html = BillsUI({ data: bills })
      document.body.innerHTML = `<div id="root'>${html}</div>`
      const billsContainer = new Bills({
        document: document, onNavigate:(route)=>route
      })
      window.$.fn.modal = jest.fn(()=>modalIsOpen=true)
      const handleClickIconEye = jest.fn((e) => {
        billsContainer.handleClickIconEye(e.target)
      })
      const buttonsIconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`)
      buttonsIconEye.forEach(icon => {
        icon.addEventListener('click', handleClickIconEye)
        userEvent.click(icon)
      })
      expect(handleClickIconEye).toHaveBeenCalled()
      expect(modalIsOpen).toEqual(true)
    })


    // test d'intégration GET
    test("fetches bills to an user from mock API GET", async () => {
      const getSpy = jest.spyOn(firebase, "get")
      const bills = await firebase.get()
      const userEmail ='a@a'
      const userBills = bills.data.filter(bill => bill.email === userEmail)
      expect(getSpy).toHaveBeenCalledTimes(1)
      expect(userBills.length).toBe(3)
    })

    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      )
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      )
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})




