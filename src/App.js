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
      "https://api.valantis.store:41000/",
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
    // return fetchData(action, params);
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
    return brands;
  } catch (err) {
    console.error("Ошибка при получении брендов", err);
  }
}
//получаю все цены
async function fetchPrice() {
  try {
    const price = await getFields("price");
    return price;
  } catch (err) {
    console.error("Ошибка при получении цен", err);
    return [];
  }
}
//фильтрация по цене
async function filterPrice(price) {
  try {
    const response = await fetchData("filter", {
      price,
    });
    return response;
  } catch (err) {
    console.error("Ошибка при фильтрации", err);
    return [];
  }
}

//получаю все названия
async function fetchProductName() {
  try {
    const product = await getFields("product");
    return product;
  } catch (err) {
    console.error("Ошибка при получении названия", err);
    return [];
  }
}
//фильтрация по названию
// async function filterProductName(product) {
//   try {
//     const response = await fetchData("filter", {
//       product,
//     });
//     return response;
//   } catch (err) {
//     console.error("Ошибка при фильтрации", err);
//     return [];
//   }
// }

function App() {
  const [products, setProducts] = useState([]); //все товары
  const [allProducts, setAllProducts] = useState([]);
  const [originProducts, setOriginProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [startPage, setStartPage] = useState(1); //начальная стр в пагинации

  const [showPagination, setShowPagination] = useState(true); // Флаг для отображения пагинации

  const [selectedBrands, setSelectedBrands] = useState(""); // состояние для избран брендов
  const [availableBrands, setAvailableBrands] = useState([]); // состояние для доступных брендов

  const [valuePrice, setValuePrice] = useState(""); //цена
  const [availablePrices, setAvailablePrices] = useState([]); // состояние для доступных цен

  const [searchQuery, setSearchQuery] = useState(""); // Состояние для хранения поискового запроса
  const [filteredProductsName, setFilteredProductsName] = useState([]); // Состояние для хранения отфильтрованных товаров

  const [loading, setLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false); //кнопка наверх

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
      try {
        const brands = await fetchBrands(); // Загрузка доступных брендов
        setAvailableBrands(brands);

        const prices = await fetchPrice(); // Загрузка доступных цен
        setAvailablePrices(prices); // Сохранение полученных цен в состояние

        const name = await fetchProductName(); //загрузка доступных названий
        setFilteredProductsName(name);

        setLoading(false);
      } catch (err) {
        console.error("Ошибка при загрузке данных", err);
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
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
          className="paginator_num"
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

  const handleBrandChange = async (event) => {
    const selectedBrand = event.target.value;
    setSelectedBrands(selectedBrand);
    // Фильтрация товаров по бренду и названию
    const filteredByBrandAndName = allProducts.filter(
      (product) =>
        (selectedBrand === "" || product.brand === selectedBrand) && // Фильтрация по бренду
        product.product.toLowerCase().includes(searchQuery.toLowerCase()) // Фильтрация по названию
    );
    // Применение фильтрации по цене, если выбрана
    if (valuePrice !== "") {
      const priceNumber = parseFloat(valuePrice);
      if (!isNaN(priceNumber)) {
        const filteredByPrice = await filterPrice(priceNumber); // Фильтрация по цене
        const filteredByPriceProducts = await getProducts(filteredByPrice);
        // Применение дополнительной фильтрации по цене
        const productsToShow = filteredByPriceProducts.filter((product) =>
          filteredByBrandAndName.some(
            (filteredProduct) => filteredProduct.id === product.id
          )
        );
        setProducts(productsToShow);
      } else {
        console.warn("Цена должна быть числом");
      }
    } else {
      // Если цена не выбрана, применяю только фильтрацию по бренду и названию
      setProducts(filteredByBrandAndName);
    }
    setShowPagination(false);
  };

  const handleFilterPrice = async () => {
    try {
      setLoading(true);
      const price = parseFloat(valuePrice);
      if (!isNaN(price)) {
        // Фильтрую товары по цене
        const filteredIds = await filterPrice(price);
        const filteredProducts = await getProducts(filteredIds);
        // Применение дополнительной фильтрации по бренду, если выбран
        const productsToShow = filteredProducts.filter(
          (product) => selectedBrands === "" || product.brand === selectedBrands
        );
        // Устанавливаю отфильтрованные товары
        setProducts(productsToShow);
      }
      setLoading(false);
      setShowPagination(false); // Скрыть пагинацию
    } catch (error) {
      console.error("Ошибка при фильтрации товаров по цене:", error);
      setLoading(false);
    }
  };

  const handleFilterProduct = async () => {
    const lowercaseQuery = searchQuery.toLowerCase();
    let filtered = allProducts.filter(
      (product) =>
        product.product.toLowerCase().includes(lowercaseQuery) &&
        (selectedBrands === "" || product.brand === selectedBrands)
    );
    // Применение фильтрации по цене, если цена выбрана
    if (valuePrice !== "") {
      const price = parseFloat(valuePrice);
      if (!isNaN(price)) {
        const filteredIds = await filterPrice(price);
        const filteredByPriceProducts = await getProducts(filteredIds);
        // Применение дополнительной фильтрации по цене
        filtered = filteredByPriceProducts.filter((product) =>
          filtered.some((filteredProduct) => filteredProduct.id === product.id)
        );
      } else {
        console.warn("Цена должна быть числом");
      }
    }
    setProducts(filtered);
    setShowPagination(false); // Скрыть пагинацию
  };

  const handleResetFilters = () => {
    setSelectedBrands(""); // Сброс выбранного бренда
    setValuePrice(""); // Сброс выбранной цены
    setSearchQuery(""); //сброс названия
    setShowPagination(true); // Вернуть пагинацию
    setCurrentPage(1); // Вернуться на первую страницу
    // Обновить список товаров на странице в соответствии с первоначальными данными
    setProducts(allProducts.slice(0, pageSize));
  };
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" }); // Прокрутка страницы вверх
  };

  return (
    <div className="App">
      <button
        className={`scrollToTop ${showScrollButton ? "visible" : ""}`}
        onClick={scrollToTop}
      >
        ↑
      </button>

      <h1>Список товаров</h1>
      <div className="filters">
        <div className="filter">
          <label htmlFor="brand">
            <h2>Выберите бренд:</h2>
          </label>
          <select
            id="brand"
            value={selectedBrands}
            onChange={handleBrandChange}
          >
            <option value="">Все бренды</option>
            {availableBrands.map((brand, index) => (
              <option key={index} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        <div className="filter">
          {" "}
          <h2>Напишите цену:</h2>
          <div>
            <input
              className="input_price"
              onChange={(event) => {
                setValuePrice(event.target.value);
              }}
              type="number"
              value={valuePrice}
            />

            <button onClick={handleFilterPrice}> Применить</button>
          </div>
        </div>

        <div className="filter">
          <h2>Поиск по названию:</h2>
          <div>
            <input
              type="text"
              placeholder="Введите название товара"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <button onClick={handleFilterProduct}>Применить</button>
          </div>
        </div>
      </div>

      <button className="removeButton" onClick={handleResetFilters}>
        Сбросить все фильтры
      </button>
      <br />
      <div className="paginator">
        {" "}
        {showPagination && (
          <button onClick={handlePrevPage} disabled={currentPage === 1}>
            Назад
          </button>
        )}
        {renderPaginator()}
        {showPagination && <button onClick={handleNextPage}>Вперед</button>}
      </div>

      {loading ? (
        <p>Загрузка товаров...</p>
      ) : (
        <div>
          <ul className="App_block">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <li key={product.id} className="App_elem">
                  <p className="product">{product.product}</p>
                  <p className="product_brand">{product.brand}</p>
                  <p className="product_id">{product.id}</p>
                  <p className="product_price">{product.price} ₽</p>
                </li>
              ))
            ) : (
              <p>Нет товаров для отображения</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
