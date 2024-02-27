import { useEffect, useState } from "react";
import "./App.css";

// Функция для выполнения запросов к API
async function fetchData(action, params = {}) {
  const password = "Valantis";
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const md5 = require("md5");

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "X-Auth": md5(`${password}_${timestamp}`),
    },
    body: JSON.stringify({ action, params }),
  };

  try {
    const response = await fetch(
      "http://api.valantis.store:40000/",
      requestOptions
    );
    if (!response.ok) {
      throw new Error(`Ошибка ${response.status}`);
    }
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("Ошибка при выполнении запроса:", error);
    // Повторный запрос при ошибке
    return fetchData(action, params);
  }
}
// Функция для получения списка ID товаров и лимит
async function getProductIds(offset = 0, limit = 50) {
  const ids = await fetchData("get_ids", { offset, limit: limit + 1 }); //на один товар больше на 1ой стр
  return ids.filter((id, index) => ids.indexOf(id) === index);
}

// Функция для получения информации о товарах по их ID
async function getProducts(ids) {
  if (!ids || ids.length === 0) return null;
  const params = { ids };
  return await fetchData("get_items", params);
}

// Функция для получения доступных полей товаров
async function getFields(field) {
  try {
    const brands = await fetchData("get_fields", { field });
    if (!brands || brands.length === 0) {
      return [];
    }
    //фильтрую уникал и непустые значения
    const uniqueBrands = brands.filter((brand) => brand !== null);
    return Array.from(new Set(uniqueBrands)); //убираю дубли
  } catch (err) {
    console.error("Ошибка", err);
    return [];
  }
}

//запрашиваю доступные значения поля brand
async function fetchBrands() {
  try {
    const brands = await getFields("brand");
    console.log("Доступные бренды - ", brands);
    return brands;
  } catch (err) {
    console.error("Ошибка при получении брендов", err);
  }
}

//загрузка всех товаров выбранного бренда из всего набора данных
// const getProductsForBrand = async (brand) => {
//   try {
//     const allIds = await getProductIds(0, 9999); // Получаю все идентификаторы товаров
//     const allProducts = await getProducts(allIds); // Получаем все товары

//     // Фильтрую товары по выбранному бренду
//     const productsForBrand = allProducts.filter(
//       (product) => product.brand === brand
//     );

//     return productsForBrand;
//   } catch (error) {
//     console.error("Ошибка при загрузке товаров по бренду:", error);
//     return [];
//   }
// };

function App() {
  const [products, setProducts] = useState([]); //все товары
  const [allProducts, setAllProducts] = useState([]);
  const [originProducts, setOriginProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [startPage, setStartPage] = useState(1); //начальная стр в пагинации

  const [showPagination, setShowPagination] = useState(true); // Флаг для отображения пагинации

  const [selectedBrands, setSelectedBrands] = useState(""); // состояние для избран брендов
  const [availableBrands, setAvailableBrands] = useState([]); // состояние для доступных брендов

  const [loading, setLoading] = useState(false);

  const pageCount = 10; //кол-во стр в пагинации
  const pageSize = 50; //кол-во товаров на стр

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const ids = await getProductIds(0, 9999);
        const productsData = await getProducts(ids);

        // Убираем дубликаты по id
        const uniqueProducts = [];
        const uniqueIds = [];
        productsData.forEach((product) => {
          if (!uniqueIds.includes(product.id)) {
            uniqueIds.push(product.id);
            uniqueProducts.push(product);
          }
        });

        setAllProducts(uniqueProducts);
        setProducts(uniqueProducts.slice(0, pageSize));
        setOriginProducts(uniqueProducts);

        setLoading(false);
      } catch (err) {
        console.error("Ошибка при загрузке всех товаров", err);
        setLoading(false);
      }
    };

    fetchData();

    return () => {};
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * pageSize;
        const limit = currentPage === 1 ? pageSize + 1 : pageSize;

        const ids = await getProductIds(offset, limit);
        const productsData = await getProducts(ids.slice(0, pageSize));

        // Убираем дубликаты по id
        const unProducts = [];
        const unIds = [];
        productsData.forEach((product) => {
          if (!unIds.includes(product.id)) {
            unIds.push(product.id);
            unProducts.push(product);
          }
        });
        // setAllProducts(unProducts); //сохраняю все товары
        setProducts(unProducts); //обновляю текущ товары для отображения

        setLoading(false);
      } catch (error) {
        console.error("Ошибка при загрузке товаров:", error);
        setLoading(false);
      }
    };
    fetchProducts();
  }, [currentPage]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const brands = await fetchBrands();
      setAvailableBrands(brands);
    };
    fetchInitialData();
  }, []);

  const handlePrevPage = () => {
    const newStartPage = startPage - pageCount;
    const newPage = currentPage - pageCount;
    if (newStartPage >= 1) {
      //предотвращаю переход в отрицательные значения стр
      setCurrentPage(newPage);
      setStartPage(newStartPage);
    } else {
      //если начал стр меньше 1,то устанавливаю ее 1
      setCurrentPage(1);
      setStartPage(1);
    }
  };
  const handleNextPage = () => {
    const newStartPage = startPage + pageCount;
    const newPage = currentPage + pageCount;
    setCurrentPage(newPage);
    setStartPage(newStartPage);
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPaginator = () => {
    if (!showPagination) {
      return null; // Если пагинация скрыта, не отображаем её
    }
    const pagination = [];
    const endPage = startPage + pageCount - 1;
    for (let i = startPage; i <= endPage; i++) {
      pagination.push(
        <button
          key={i}
          onClick={() => handlePageClick(i)}
          disabled={i === currentPage}
        >
          {i}
        </button>
      );
    }
    return pagination;
  };

  const filteredProducts = selectedBrands
    ? products.filter((product) => product.brand === selectedBrands)
    : products;

  // const handleBrandChange = (event) => {
  //   setSelectedBrands(event.target.value);
  // };

  const handleBrandChange = async (event) => {
    const selectedBrand = event.target.value;
    setSelectedBrands(selectedBrand);
    if (selectedBrand !== "") {
      setShowPagination(false);
    } else {
      setShowPagination(true);
    }
    try {
      const filteredProducts = selectedBrand
        ? allProducts.filter((product) => product.brand === selectedBrand)
        : allProducts;

      setProducts(filteredProducts.slice(0, pageSize)); //обрезаю список до максимум 50 товаров
    } catch (error) {
      console.error("Ошибка при загрузке товаров:", error);
    }
  };

  return (
    <div>
      <h1>Список товаров</h1>
      <div>
        <label htmlFor="brand">Выберите бренд:</label>
        <select id="brand" value={selectedBrands} onChange={handleBrandChange}>
          <option value="">Все бренды</option>
          {availableBrands.map((brand, index) => (
            <option key={index} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      {showPagination && (
        <button onClick={handlePrevPage} disabled={currentPage === 1}>
          Назад
        </button>
      )}

      {renderPaginator()}
      {showPagination && <button onClick={handleNextPage}>Вперед</button>}

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="product-list">
          <ul className="App_block">
            {filteredProducts.map((product) => (
              <li key={product.id} className="App_elem">
                <p>{product.product}</p>
                <p>{product.brand}</p>
                <p>{product.id}</p>
                <p>{product.price} ₽</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
