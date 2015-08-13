'use strict'

angular.module 'webappApp'
.controller 'CmsCtrl', ($scope, $http) ->

  route = 'api/cms'
  selected_file = ''
  selected = false

  set_preview = (input) ->
    if input.files and input.files[0]
      reader = new FileReader()
      reader.onload = (e) ->
        $('#file_preview').attr 'src', e.target.result
      reader.readAsDataURL(input.files[0])

  populate_images = () ->
    $('#images_col').empty()
    $http({
      url: route + '/images',
      method: 'GET'
    }).success (response) ->
      i = 0
      while i < response.length
        $('#images_col').append '<div class="image">
                                  <div class="x_box"></div>
                                  <div class="x_mark">
                                   <span>' + response[i] + '</span>
                                  </div>
                                 </div>'
        i += 1

  populate_categories = () ->
    $('#capas_col, #prods_col').empty()
    $http({
      url: route + '/capa',
      method: 'GET'
    }).success (response) ->
      i = 0
      while i < response.length
        $('#capas_col').append '<div class="capa">
                                 <div class="x_box"></div>
                                 <input type="checkbox">
                                 <input type="checkbox">
                                 <input type="checkbox">
                                 <div class="x_mark">
                                  <span>' + response[i] + '</span>
                                 </div>
                                </div>'
        i++
    $http({
      url: route + '/prod',
      method: 'GET'
    }).success (response) ->
      i = 0
      while i < response.length
        $('#prods_col').append '<div class="prod">
                                 <div class="x_box"></div>
                                 <input type="checkbox">
                                 <input type="checkbox">
                                 <input type="checkbox">
                                 <div class="x_mark">
                                  <span>' + response[i] + '</span>
                                 </div>
                                </div>'
        i++

  delete_image = (file) ->
    $http({
      url: route + '/images',
      method: 'DELETE',
      params: {filename: file}
    }).success () ->
      populate_images()

  add_capa = (capa) ->
    $http({
      url: route + '/capa',
      method: 'POST',
      params: {category: capa}
    }).success () ->
      populate_categories()

  delete_capa = (capa) ->
    $http({
      url: route + '/capa',
      method: 'DELETE',
      params: {category: capa}
    }).success () ->
      populate_categories()

  add_prod = (prod) ->
    $http({
      url: route + '/prod',
      method: 'POST',
      params: {category: prod}
    }).success () ->
      populate_categories()

  delete_prod = (prod) ->
    $http({
      url: route + '/prod',
      method: 'DELETE',
      params: {category: prod}
    }).success () ->
      populate_categories()

  all_purpose_category_tag_manipulation_function = (_operation, _file, _category, _name) ->
    $http({
      url: route + '/images',
      method: 'PUT',
      params: {operation: _operation, file: _file, category: _category, name: _name}
    })

  # basically $(document).ready()
  init = () ->

    populate_images()
    populate_categories()

    # preview on selecting an image
    $('#file_select').change () ->
      selected_file = ''
      selected = false
      set_preview(this)

    # upload file submit event
    $('#file_upload').on 'click', () ->
      if $('#file_select').val()
        $('form').submit()

    # display preview on hover
    $('#images_col').on 'mouseover', '.image', () ->
      if !$('#file_select').val() and !selected
        $('#file_preview').attr 'src', '../../../assets/images/uploads/' + $(this).children('.x_mark').children('span').text()

    # clear display image on mouseleave
    $('#images_col').on 'mouseleave', '.image', () ->
      if !$('#file_select').val() and !selected
        $('#file_preview').attr 'src', ''

    # change selected image on click
    $('#images_col').on 'click', '.image', () ->
      $('#images_col .image').css 'background-color', ''
      if $(this).children('.x_mark').children('span').text() != selected_file
        selected_file = $(this).children('.x_mark').children('span').text()
        $(this).css 'background-color', '#F26522'
        selected = true
      else
        selected = false
        selected_file = ''

    # delete image on clicking cross
    $('#images_col').on 'click', '.image .x_box', () ->
      delete_image($(this).siblings('.x_mark').children('span').text())

    # add a capability category
    $('#capa_button').on 'click', () ->
      if $('#capa_input').val()
        add_capa($('#capa_input').val())
        $('#capa_input').val('')

    # add a product category
    $('#prod_button').on 'click', () ->
      if $('#prod_input').val()
        add_prod($('#prod_input').val())
        $('#prod_input').val('')

    # delete a capability category
    $('#capas_col').on 'click', '.capa .x_box', () ->
      delete_capa($(this).siblings('.x_mark').children('span').text())

    # delete a product category
    $('#prods_col').on 'click', '.prod .x_box', () ->
      delete_prod($(this).siblings('.x_mark').children('span').text())

  init()
