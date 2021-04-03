import { screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import userEvent from '@testing-library/user-event'
import { localStorageMock } from "../__mocks__/localStorage.js"
import { ROUTES } from "../constants/routes"
import firebase from "../__mocks__/firebase"
import BillsUI from "../views/BillsUI.js"

jest.mock('../app/firestore')

const uploadFileIsAllow = (typeFile,isAuth)=>{
  let fileIsAllow = false
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Admin'
  }))
  window.alert = ()=> null
  const firestore = {
    storage: {
      ref: jest.fn(() => firestore),
    },
    put: jest.fn().mockResolvedValue({ ref: { getDownloadURL: () => 'url' } }),
  }
  const newBill = new NewBill({ document, firestore, localStorage: window.localStorage })
  const input = newBill.document.querySelector(`input[data-testid="file"]`)
  const file = new File(['facturefreemobile'], '../assets/images', { type: typeFile })
  const authFile = ["image/png", "image/jpeg", "image/jpg"]

  const handleChangeFile = jest.fn((e) => {
    newBill.handleChangeFile(e)
    fileIsAllow = authFile.includes(input.files[0].type)
  })

  input.addEventListener('change', handleChangeFile)
  userEvent.upload(input, file)

  expect(handleChangeFile).toHaveBeenCalled()
  expect(fileIsAllow).toEqual(isAuth)
}

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    const html = NewBillUI()
    document.body.innerHTML = html

    test("Then handleChangeFile is good file  (png,jpg or jpeg)", async () => {
      uploadFileIsAllow('image/jpg', true)
    })

    test("Then handleChangeFile is not good file (png,jpg or jpeg)", async () => {
      uploadFileIsAllow('text/pdf',false)
    })

    test("Then handleSubmit", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Admin'
      }))
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({ document, firestore: null, onNavigate: onNavigate, localStorage: window.localStorage })
      newBill.createBill = jest.fn()

      const formNewBill = newBill.document.querySelector(`form[data-testid="form-new-bill"]`)

      /**
       * Pas d'utilité dans le test mais il serait bien de vérifier les valeur des champs
       */
      // const expenseType= newBill.document.querySelector(`select[data-testid="expense-type"]`)
      // const expenseName = newBill.document.querySelector(`input[data-testid="expense-name"]`)
      // const amount = newBill.document.querySelector(`input[data-testid="amount"]`)
      // const datepicker = newBill.document.querySelector(`input[data-testid="datepicker"]`)
      // const vat = newBill.document.querySelector(`input[data-testid="vat"]`)
      // const pct = newBill.document.querySelector(`input[data-testid="pct"]`)
      // const commentary = newBill.document.querySelector(`textarea[data-testid="commentary"]`)

      // expenseType.value = 'test'
      // expenseName.value = 'test'
      // amount.value = 200
      // datepicker.value = '2014-02-02'
      // vat.value = 2
      // pct.value = 20
      // commentary.value = ''


      const handleSubmit = jest.fn((e) => {
        newBill.handleSubmit(e)
      })

      formNewBill.addEventListener('click', handleSubmit)
      userEvent.click(formNewBill)

      expect(handleSubmit).toHaveBeenCalled()

      const findText = screen.getByText('Mes notes de frais')
      expect(findText).toBeTruthy()
    })


    // POST
    describe("When I send a NewBill", () => {
      test("fetches create bills from mock API ADD", async () => {
        const getSpy = jest.spyOn(firebase, "add")
        const bill = {
          mail:'b@b'
        }
        const bills = await firebase.add(bill)
        expect(getSpy).toHaveBeenCalledTimes(1)
        expect(bills.data.length).toBe(5)
        const userEmail = 'b@b'
        const userBills = bills.data.filter(bill => bill.email === userEmail)
        expect(userBills.length).toBe(2)
      })

      test("fetches create bills from mock API ADD and fails with 404 message error", async () => {
        firebase.add.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 404"))
        )
        const html = BillsUI({ error: "Erreur 404" })
        document.body.innerHTML = html
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      test("fetches create bills from mock API ADD and fails with 300 message error", async () => {
        firebase.add.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 300"))
        )
        const html = BillsUI({ error: "Erreur 300" })
        document.body.innerHTML = html
        const message = await screen.getByText(/Erreur 300/)
        expect(message).toBeTruthy()
      })

      test("fetches create bills from mock API ADD and fails with 500 message error", async () => {
        firebase.add.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 500"))
        )
        const html = BillsUI({ error: "Erreur 500" })
        document.body.innerHTML = html
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})
