var items_secret_key = "PBG892FXX982ABC*"
var data_json = {}
var encoded_buffer_file = [];

const byteToHex = [];

for (let n = 0; n <= 0xff; ++n) {
    const hexOctet = n.toString(16).padStart(2, "0");
    byteToHex.push(hexOctet);
}

var saveData = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    /**
     * @param {ArrayBuffer} data
     * @param {string} fileName
     */
    return function (data, fileName) {
            blob = new Blob([data], {type: "octet/stream"}),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());

var saveDataBuffer = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    /**
     * @param {ArrayBuffer} data
     * @param {string} fileName
     */
    return function (data, fileName) {
            blob = new Blob([new Uint8Array(data)], {type: "octet/stream"}),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());

/**
 * @param {ArrayBuffer} arrayBuffer
 * @return {string}
 */
function hex(arrayBuffer) {
    const buff = new Uint8Array(arrayBuffer);
    const hexOctets = [];
    for (let i = 0; i < buff.length; ++i) hexOctets.push(byteToHex[buff[i]]);

    return hexOctets.join(" ");
}

/**
 * @param {ArrayBuffer} buffer
 * @param {number} pos
 * @param {number} len
 * @return {string}
 */
function read_buffer_number(buffer, pos, len) {
    let value = 0;
    for (let a = 0; a < len; a++) value += buffer[pos + a] << (a * 8)

    return value;
}

/**
 * @param {number} pos
 * @param {number} len
 * @param {number} value
 */
function write_buffer_number(pos, len, value) {
    for (let a = 0; a < len; a++) {
        encoded_buffer_file[pos + a] = (value >> (a * 8)) & 255;
    }
}

function write_buffer_string(pos, len, value, using_key, item_id) {
    for (let a = 0; a < len; a++) {
        if (using_key) encoded_buffer_file[pos + a] = value.charCodeAt(a) ^ (items_secret_key.charCodeAt((a + item_id) % items_secret_key.length))
        else encoded_buffer_file[pos + a] = value.charCodeAt(a)
    }
}

/**
 * Convert a hex string to an ArrayBuffer.
 * 
 * @param {string} hexString - hex representation of bytes
 * @return {ArrayBuffer} - The bytes in an ArrayBuffer.
 */
function hexStringToArrayBuffer(pos, hexString) { //https://gist.github.com/don/871170d88cf6b9007f7663fdbc23fe09
    // remove the space
    hexString = hexString.replace(/ /g, '');
    if (hexString.length % 2 != 0) console.log('WARNING: expecting an even number of characters in the hexString');
    
    // check for some non-hex characters
    var bad = hexString.match(/[G-Z\s]/i);
    if (bad) console.log('WARNING: found non-hex characters', bad);    

    // convert the octets to integers
    var integers = hexString.match(/[\dA-F]{2}/gi).map(function(s) {
        encoded_buffer_file[pos++] = parseInt(s, 16)
    });

    return integers
}

/**
 * @param {ArrayBuffer} buffer
 * @param {number} pos
 * @param {number} len
 * @param {boolean} using_key
 * @param {number} item_id
 */
function read_buffer_string(buffer, pos, len, using_key, item_id) {
    var result = "";
    if (using_key) for (let a = 0; a < len; a++) result += String.fromCharCode(buffer[a + pos] ^ items_secret_key.charCodeAt((item_id + a) % items_secret_key.length))
    else for (let a = 0; a < len; a++) result += String.fromCharCode(buffer[a + pos])
    
    return result;
}

document.getElementById('decode_items_dat').addEventListener('click', function () {
    var input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';

    input.onchange = function (e) {
        var file = e.target.files[0];
        item_decoder(file);
    };

    document.body.appendChild(input);
    input.click();
});

document.getElementById('decode_items_dat_editor').addEventListener('click', function () {
    var input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';

    input.onchange = function (e) {
        var file = e.target.files[0];
        item_decoder(file, true);
    };

    document.body.appendChild(input);
    input.click();
});

document.getElementById('encode_items_dat').addEventListener('click', function () {
    var input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';

    input.onchange = function (e) {
        var file = e.target.files[0];
        item_encoder(file);
    };

    document.body.appendChild(input);
    input.click();
});

/**
 * @param {Blob} file
 * @param {boolean} using_editor
 */

function process_item_encoder(result) {
    var mem_pos = 6;

    write_buffer_number(0, 2, result.version)
    write_buffer_number(2, 4, result.item_count)
    for (let a = 0; a < result.item_count; a++) {
        write_buffer_number(mem_pos, 4, result.items[a].item_id);
        mem_pos += 4;
        encoded_buffer_file[mem_pos++] = result.items[a].editable_type
        encoded_buffer_file[mem_pos++] = result.items[a].item_category
        encoded_buffer_file[mem_pos++] = result.items[a].action_type
        encoded_buffer_file[mem_pos++] = result.items[a].hit_sound_type
        write_buffer_number(mem_pos, 2, result.items[a].name.length);
        mem_pos += 2;
        write_buffer_string(mem_pos, result.items[a].name.length, result.items[a].name, 1, result.items[a].item_id)
        mem_pos += result.items[a].name.length
        write_buffer_number(mem_pos, 2, result.items[a].texture.length);
        mem_pos += 2;
        write_buffer_string(mem_pos, result.items[a].texture.length, result.items[a].texture)
        mem_pos += result.items[a].texture.length
        write_buffer_number(mem_pos, 4, result.items[a].texture_hash)
        mem_pos += 4;
        encoded_buffer_file[mem_pos++] = result.items[a].item_kind
        write_buffer_number(mem_pos, 4, result.items[a].val1)
        mem_pos += 4;
        encoded_buffer_file[mem_pos++] = result.items[a].texture_x
        encoded_buffer_file[mem_pos++] = result.items[a].texture_y
        encoded_buffer_file[mem_pos++] = result.items[a].spread_type
        encoded_buffer_file[mem_pos++] = result.items[a].is_stripey_wallpaper
        encoded_buffer_file[mem_pos++] = result.items[a].collision_type
        encoded_buffer_file[mem_pos++] = result.items[a].break_hits
        write_buffer_number(mem_pos, 4, result.items[a].drop_chance)
        mem_pos += 4;
        encoded_buffer_file[mem_pos++] = result.items[a].clothing_type
        write_buffer_number(mem_pos, 2, result.items[a].rarity)
        mem_pos += 2;
        
        encoded_buffer_file[mem_pos++] = result.items[a].max_amount
        write_buffer_number(mem_pos, 2, result.items[a].extra_file.length);
        mem_pos += 2;
        write_buffer_string(mem_pos, result.items[a].extra_file.length, result.items[a].extra_file)
        mem_pos += result.items[a].extra_file.length
        write_buffer_number(mem_pos, 4, result.items[a].extra_file_hash)
        mem_pos += 4;
        write_buffer_number(mem_pos, 4, result.items[a].audio_volume)
        mem_pos += 4;
        write_buffer_number(mem_pos, 2, result.items[a].pet_name.length);
        mem_pos += 2;
        write_buffer_string(mem_pos, result.items[a].pet_name.length, result.items[a].pet_name)
        mem_pos += result.items[a].pet_name.length
        write_buffer_number(mem_pos, 2, result.items[a].pet_prefix.length);
        mem_pos += 2;
        write_buffer_string(mem_pos, result.items[a].pet_prefix.length, result.items[a].pet_prefix)
        mem_pos += result.items[a].pet_prefix.length
        write_buffer_number(mem_pos, 2, result.items[a].pet_suffix.length);
        mem_pos += 2;
        write_buffer_string(mem_pos, result.items[a].pet_suffix.length, result.items[a].pet_suffix)
        mem_pos += result.items[a].pet_suffix.length
        write_buffer_number(mem_pos, 2, result.items[a].pet_ability.length);
        mem_pos += 2;
        write_buffer_string(mem_pos, result.items[a].pet_ability.length, result.items[a].pet_ability)
        mem_pos += result.items[a].pet_ability.length
        encoded_buffer_file[mem_pos++] = result.items[a].seed_base
        encoded_buffer_file[mem_pos++] = result.items[a].seed_overlay
        encoded_buffer_file[mem_pos++] = result.items[a].tree_base
        encoded_buffer_file[mem_pos++] = result.items[a].tree_leaves
        encoded_buffer_file[mem_pos++] = result.items[a].seed_color.a
        encoded_buffer_file[mem_pos++] = result.items[a].seed_color.r
        encoded_buffer_file[mem_pos++] = result.items[a].seed_color.g
        encoded_buffer_file[mem_pos++] = result.items[a].seed_color.b
        encoded_buffer_file[mem_pos++] = result.items[a].seed_overlay_color.a
        encoded_buffer_file[mem_pos++] = result.items[a].seed_overlay_color.r
        encoded_buffer_file[mem_pos++] = result.items[a].seed_overlay_color.g
        encoded_buffer_file[mem_pos++] = result.items[a].seed_overlay_color.b
        write_buffer_number(mem_pos, 4, 0); // skipping ingredients
        mem_pos += 4;
        write_buffer_number(mem_pos, 4, result.items[a].grow_time);
        mem_pos += 4;
        write_buffer_number(mem_pos, 2, result.items[a].val2);
        mem_pos += 2;
        write_buffer_number(mem_pos, 2, result.items[a].is_rayman);
        mem_pos += 2;
        write_buffer_number(mem_pos, 2, result.items[a].extra_options.length);
        mem_pos += 2;
        write_buffer_string(mem_pos, result.items[a].extra_options.length, result.items[a].extra_options)
        mem_pos += result.items[a].extra_options.length
        write_buffer_number(mem_pos, 2, result.items[a].texture2.length);
        mem_pos += 2;
        write_buffer_string(mem_pos, result.items[a].texture2.length, result.items[a].texture2)
        mem_pos += result.items[a].texture2.length
        write_buffer_number(mem_pos, 2, result.items[a].extra_options2.length);
        mem_pos += 2;
        write_buffer_string(mem_pos, result.items[a].extra_options2.length, result.items[a].extra_options2)
        mem_pos += result.items[a].extra_options2.length
        hexStringToArrayBuffer(mem_pos, result.items[a].data_position_80)
        mem_pos += 80;
        if (result.version >= 11) {
            write_buffer_number(mem_pos, 2, result.items[a].punch_options.length);
            mem_pos += 2;
            write_buffer_string(mem_pos, result.items[a].punch_options.length, result.items[a].punch_options)
            mem_pos += result.items[a].punch_options.length
        }
        if (result.version >= 12) {
            hexStringToArrayBuffer(mem_pos, result.items[a].data_version_12)
            mem_pos += 13;
        }
        if (result.version >= 13) {
            write_buffer_number(mem_pos, 4, result.items[a].int_version_13)
            mem_pos += 4;
        }
        if (result.version >= 14) {
            write_buffer_number(mem_pos, 4, result.items[a].int_version_14)
            mem_pos += 4;
        }
        if (result.version >= 15) {
            hexStringToArrayBuffer(mem_pos, result.items[a].data_version_15)
            mem_pos += 25;
            write_buffer_number(mem_pos, 2, result.items[a].str_version_15.length);
            mem_pos += 2;
            write_buffer_string(mem_pos, result.items[a].str_version_15.length, result.items[a].str_version_15)
            mem_pos += result.items[a].str_version_15.length
        }
        if (result.version >= 16) {
            write_buffer_number(mem_pos, 2, result.items[a].int_version_16)
            mem_pos += 2;
        }
    }
}

function item_encoder(file, using_editor) {
    if (using_editor) {
        process_item_encoder(data_json);
        saveDataBuffer(encoded_buffer_file, "items.dat")
        return encoded_buffer_file = []
    } else {
        var reader = new FileReader();
        reader.readAsText(file);

        reader.onload = function (e) {
            try {
                process_item_encoder(JSON.parse(e.target.result))
                saveDataBuffer(encoded_buffer_file, "items.dat")
                return encoded_buffer_file = []
            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        }
    }
    
}

/**
 * @param {Blob} file
 * @param {boolean} using_editor
 */
function item_decoder(file, using_editor) {
    data_json = {}
    let mem_pos = 6;
    var reader = new FileReader()
    reader.readAsArrayBuffer(file);

    reader.onload = function (e) {
        var arrayBuffer = new Uint8Array(e.target.result);
        var version = read_buffer_number(arrayBuffer, 0, 2);
        var item_count = read_buffer_number(arrayBuffer, 2, 4);

        data_json.version = version
        data_json.item_count = item_count
        data_json.items = []

        for (let a = 0; a < item_count; a++) {
            var item_id = read_buffer_number(arrayBuffer, mem_pos, 4);
            mem_pos += 4;

            var editable_type = arrayBuffer[mem_pos++];
            var item_category = arrayBuffer[mem_pos++];
            var action_type = arrayBuffer[mem_pos++];
            var hit_sound_type = arrayBuffer[mem_pos++];

            var len = read_buffer_number(arrayBuffer, mem_pos, 2)
            mem_pos += 2;
            var name = read_buffer_string(arrayBuffer, mem_pos, len, true, Number(item_id));
            mem_pos += len;

            len = read_buffer_number(arrayBuffer, mem_pos, 2)
            mem_pos += 2;
            var texture = read_buffer_string(arrayBuffer, mem_pos, len);
            mem_pos += len;

            var texture_hash = read_buffer_number(arrayBuffer, mem_pos, 4);
            mem_pos += 4;

            var item_kind = arrayBuffer[mem_pos++];

            var val1 = read_buffer_number(arrayBuffer, mem_pos, 4);
            mem_pos += 4;

            var texture_x = arrayBuffer[mem_pos++];
            var texture_y = arrayBuffer[mem_pos++];
            var spread_type = arrayBuffer[mem_pos++];
            var is_stripey_wallpaper = arrayBuffer[mem_pos++];
            var collision_type = arrayBuffer[mem_pos++];
            var break_hits = arrayBuffer[mem_pos++];
            
            var drop_chance = read_buffer_number(arrayBuffer, mem_pos, 4);
            mem_pos += 4;

            var clothing_type = arrayBuffer[mem_pos++];

            var rarity = read_buffer_number(arrayBuffer, mem_pos, 2);
            mem_pos += 2;
            
            var max_amount = arrayBuffer[mem_pos++];

            len = read_buffer_number(arrayBuffer, mem_pos, 2)
            mem_pos += 2;
            var extra_file = read_buffer_string(arrayBuffer, mem_pos, len);
            mem_pos += len;

            var extra_file_hash = read_buffer_number(arrayBuffer, mem_pos, 4);
            mem_pos += 4;

            var audio_volume = read_buffer_number(arrayBuffer, mem_pos, 4);
            mem_pos += 4;

            len = read_buffer_number(arrayBuffer, mem_pos, 2)
            mem_pos += 2;
            var pet_name = read_buffer_string(arrayBuffer, mem_pos, len);
            mem_pos += len;

            len = read_buffer_number(arrayBuffer, mem_pos, 2)
            mem_pos += 2;
            var pet_prefix = read_buffer_string(arrayBuffer, mem_pos, len);
            mem_pos += len;

            len = read_buffer_number(arrayBuffer, mem_pos, 2)
            mem_pos += 2;
            var pet_suffix = read_buffer_string(arrayBuffer, mem_pos, len);
            mem_pos += len;

            len = read_buffer_number(arrayBuffer, mem_pos, 2);
            mem_pos += 2;
            var pet_ability = read_buffer_string(arrayBuffer, mem_pos, len);
            mem_pos += len;

            var seed_base = arrayBuffer[mem_pos++];
            var seed_overlay = arrayBuffer[mem_pos++];
            var tree_base = arrayBuffer[mem_pos++];
            var tree_leaves = arrayBuffer[mem_pos++];

            var seed_color_a = arrayBuffer[mem_pos++];
            var seed_color_r = arrayBuffer[mem_pos++];
            var seed_color_g = arrayBuffer[mem_pos++];
            var seed_color_b = arrayBuffer[mem_pos++];
            var seed_overlay_color_a = arrayBuffer[mem_pos++];
            var seed_overlay_color_r = arrayBuffer[mem_pos++];
            var seed_overlay_color_g = arrayBuffer[mem_pos++];
            var seed_overlay_color_b = arrayBuffer[mem_pos++];

            mem_pos += 4; // skipping ingredients

            var grow_time = read_buffer_number(arrayBuffer, mem_pos, 4);
            mem_pos += 4;

            var val2 = read_buffer_number(arrayBuffer, mem_pos, 2);
            mem_pos += 2;
            var is_rayman = read_buffer_number(arrayBuffer, mem_pos, 2);
            mem_pos += 2;

            len = read_buffer_number(arrayBuffer, mem_pos, 2)
            mem_pos += 2;
            var extra_options = read_buffer_string(arrayBuffer, mem_pos, len);
            mem_pos += len;

            len = read_buffer_number(arrayBuffer, mem_pos, 2)
            mem_pos += 2;
            var texture2 = read_buffer_string(arrayBuffer, mem_pos, len);
            mem_pos += len;

            len = read_buffer_number(arrayBuffer, mem_pos, 2)
            mem_pos += 2;
            var extra_options2 = read_buffer_string(arrayBuffer, mem_pos, len);
            mem_pos += len;

            var data_position_80 = hex(arrayBuffer.slice(mem_pos, mem_pos + 80)).toUpperCase()
            mem_pos += 80;

            if (version >= 11) {
                len = read_buffer_number(arrayBuffer, mem_pos, 2)
                mem_pos += 2;
                var punch_options = read_buffer_string(arrayBuffer, mem_pos, len);
                mem_pos += len;
            }

            if (version >= 12) {
                var data_version_12 = hex(arrayBuffer.slice(mem_pos, mem_pos + 13)).toUpperCase()
                mem_pos += 13;
            }

            if (version >= 13) {
                var int_version_13 = read_buffer_number(arrayBuffer, mem_pos, 4)
                mem_pos += 4;
            }
            
            if (version >= 14) {
                var int_version_14 = read_buffer_number(arrayBuffer, mem_pos, 4)
                mem_pos += 4;
            }

            if (version >= 15) {
                var data_version_15 = hex(arrayBuffer.slice(mem_pos, mem_pos + 25)).toUpperCase()
                mem_pos += 25;

                len = read_buffer_number(arrayBuffer, mem_pos, 2);
                mem_pos += 2;
                var str_version_15 = read_buffer_string(arrayBuffer, mem_pos, len);
                mem_pos += len
            }
            //if (version >= 16) {
            //    var int_version_16 = read_buffer_number(arrayBuffer, mem_pos, 2)
            //    mem_pos += 2;
            //}
            data_json.items[a] = {}
            data_json.items[a].item_id = item_id
            data_json.items[a].editable_type = editable_type
            data_json.items[a].item_category = item_category
            data_json.items[a].action_type = action_type
            data_json.items[a].hit_sound_type = hit_sound_type
            data_json.items[a].name = name
            data_json.items[a].texture = texture
            data_json.items[a].texture_hash = texture_hash
            data_json.items[a].item_kind = item_kind
            data_json.items[a].val1 = val1
            data_json.items[a].texture_x = texture_x
            data_json.items[a].texture_y = texture_y
            data_json.items[a].spread_type = spread_type
            data_json.items[a].is_stripey_wallpaper = is_stripey_wallpaper
            data_json.items[a].collision_type = collision_type
            data_json.items[a].break_hits = break_hits
            data_json.items[a].drop_chance = drop_chance
            data_json.items[a].clothing_type = clothing_type
            data_json.items[a].rarity = rarity
            data_json.items[a].max_amount = max_amount
            data_json.items[a].extra_file = extra_file
            data_json.items[a].extra_file_hash = extra_file_hash
            data_json.items[a].audio_volume = audio_volume
            data_json.items[a].pet_name = pet_name
            data_json.items[a].pet_prefix = pet_prefix
            data_json.items[a].pet_suffix = pet_suffix
            data_json.items[a].pet_ability = pet_ability
            data_json.items[a].seed_base = seed_base
            data_json.items[a].seed_overlay = seed_overlay
            data_json.items[a].tree_base = tree_base
            data_json.items[a].tree_leaves = tree_leaves
            
            data_json.items[a].seed_color = {}
            data_json.items[a].seed_color.a = seed_color_a
            data_json.items[a].seed_color.r = seed_color_r
            data_json.items[a].seed_color.g = seed_color_g
            data_json.items[a].seed_color.b = seed_color_b

            data_json.items[a].seed_overlay_color = {}
            data_json.items[a].seed_overlay_color.a = seed_overlay_color_a
            data_json.items[a].seed_overlay_color.r = seed_overlay_color_r
            data_json.items[a].seed_overlay_color.g = seed_overlay_color_g
            data_json.items[a].seed_overlay_color.b = seed_overlay_color_b
            
            data_json.items[a].grow_time = grow_time
            data_json.items[a].val2 = val2
            data_json.items[a].is_rayman = is_rayman
            data_json.items[a].extra_options = extra_options
            data_json.items[a].texture2 = texture2
            data_json.items[a].extra_options2 = extra_options2
            data_json.items[a].data_position_80 = data_position_80
            data_json.items[a].punch_options = punch_options
            data_json.items[a].data_version_12 = data_version_12
            data_json.items[a].int_version_13 = int_version_13
            data_json.items[a].int_version_14 = int_version_14
            data_json.items[a].data_version_15 = data_version_15
            data_json.items[a].str_version_15 = str_version_15
        }
        if (using_editor) {
            if (!$.fn.dataTable.isDataTable("#itemsList")) {
                document.getElementById("itemsList").classList.remove("d-none")
                document.getElementById("save_items_dat_div").classList.remove("d-none")
                $("#itemsList").DataTable({
                  scrollY:        "500px",
                  scrollX:        true,
                  scrollCollapse: true,
                  paging:         false,
                  fixedColumns: {
                      left: 1,
                      right: 1
                  }, "lengthChange": false, "autoWidth": false,
                  "columnDefs": [
                  {
                      "targets": [0],
                      "render": function (data, type, full, meta) {
                          return type === 'display' && typeof data === 'string' ?
                              data.replace(/</g, '&lt;').replace(/>/g, '&gt;') : data;
                      }
                  }
                ]
                }).buttons().container().appendTo('#itemsList_wrapper .col-md-6:eq(0)');
                $('#itemsList').DataTable().columns.adjust()
                $(window).resize(function() {
                  $('#itemsList').DataTable().columns.adjust()
                });
            }
            var result = []
            for (let a = 0; a < item_count; a++) {
                result[a] = []
                result[a][0] = data_json.items[a].name
                result[a][1] = `<center><button class="btn btn-primary" onclick="editItems(${a})">Edit/Info</button></center>`
            }
            $("#itemsList").DataTable().rows.add(result).draw()
            result = []
        } else saveData(JSON.stringify(data_json, null, 4), "items.json");
    };
};

function editItems(posArray) {
    $("#modal-editItems").modal("show")
    document.getElementById("item_id").value = data_json.items[posArray].item_id
    document.getElementById("editable_type").value = data_json.items[posArray].editable_type
    document.getElementById("item_category").value = data_json.items[posArray].item_category
    document.getElementById("action_type").value = data_json.items[posArray].action_type
    document.getElementById("hit_sound_type").value = data_json.items[posArray].hit_sound_type
    document.getElementById("name").value = data_json.items[posArray].name
    document.getElementById("texture").value = data_json.items[posArray].texture
    document.getElementById("texture_hash").value = data_json.items[posArray].texture_hash
    document.getElementById("item_kind").value = data_json.items[posArray].item_kind
    document.getElementById("val1").value = data_json.items[posArray].val1
    document.getElementById("texture_x").value = data_json.items[posArray].texture_x
    document.getElementById("texture_y").value = data_json.items[posArray].texture_y
    document.getElementById("spread_type").value = data_json.items[posArray].spread_type
    document.getElementById("is_stripey_wallpaper").value = data_json.items[posArray].is_stripey_wallpaper
    document.getElementById("collision_type").value = data_json.items[posArray].collision_type
    document.getElementById("break_hits").value = data_json.items[posArray].break_hits
    document.getElementById("drop_chance").value = data_json.items[posArray].drop_chance
    document.getElementById("clothing_type").value = data_json.items[posArray].clothing_type
    document.getElementById("rarity").value = data_json.items[posArray].rarity
    document.getElementById("max_amount").value = data_json.items[posArray].max_amount
    document.getElementById("extra_file").value = data_json.items[posArray].extra_file
    document.getElementById("extra_file_hash").value = data_json.items[posArray].extra_file_hash
    document.getElementById("audio_volume").value = data_json.items[posArray].audio_volume
    document.getElementById("pet_name").value = data_json.items[posArray].pet_name
    document.getElementById("pet_prefix").value = data_json.items[posArray].pet_prefix
    document.getElementById("pet_suffix").value = data_json.items[posArray].pet_suffix
    document.getElementById("pet_ability").value = data_json.items[posArray].pet_ability
    document.getElementById("seed_base").value = data_json.items[posArray].seed_base
    document.getElementById("seed_overlay").value = data_json.items[posArray].seed_overlay
    document.getElementById("tree_base").value = data_json.items[posArray].tree_base
    document.getElementById("tree_leaves").value = data_json.items[posArray].tree_leaves
    document.getElementById("seed_color").value = Object.values(data_json.items[posArray].seed_color).toString()
    document.getElementById("seed_overlay_color").value = Object.values(data_json.items[posArray].seed_overlay_color).toString()
    document.getElementById("grow_time").value = data_json.items[posArray].grow_time
    document.getElementById("val2").value = data_json.items[posArray].val2
    document.getElementById("is_rayman").value = data_json.items[posArray].is_rayman
    document.getElementById("extra_options").value = data_json.items[posArray].extra_options
    document.getElementById("texture2").value = data_json.items[posArray].texture2
    document.getElementById("extra_options2").value = data_json.items[posArray].extra_options2
    document.getElementById("pos_80_data").value = data_json.items[posArray].data_position_80
    document.getElementById("punch_options").value = data_json.items[posArray].punch_options
    document.getElementById("data_version_12").value = data_json.items[posArray].data_version_12
    document.getElementById("int_version_13").value = data_json.items[posArray].int_version_13
    document.getElementById("int_version_14").value = data_json.items[posArray].int_version_14
    document.getElementById("data_version_15").value = data_json.items[posArray].data_version_15
    document.getElementById("str_version_15").value = data_json.items[posArray].str_version_15
    document.getElementById("editItemsButton").setAttribute("onclick", `processEditItems(${posArray})`)
}

function processEditItems(posArray) {
    data_json.items[posArray].item_id = document.getElementById("item_id").value
    data_json.items[posArray].editable_type = document.getElementById("editable_type").value
    data_json.items[posArray].item_category = document.getElementById("item_category").value
    data_json.items[posArray].action_type = document.getElementById("action_type").value
    data_json.items[posArray].hit_sound_type = document.getElementById("hit_sound_type").value
    data_json.items[posArray].name = document.getElementById("name").value
    data_json.items[posArray].texture = document.getElementById("texture").value
    data_json.items[posArray].texture_hash = document.getElementById("texture_hash").value
    data_json.items[posArray].item_kind = document.getElementById("item_kind").value
    data_json.items[posArray].val1 = document.getElementById("val1").value
    data_json.items[posArray].texture_x = document.getElementById("texture_x").value
    data_json.items[posArray].texture_y = document.getElementById("texture_y").value
    data_json.items[posArray].spread_type = document.getElementById("spread_type").value
    data_json.items[posArray].is_stripey_wallpaper = document.getElementById("is_stripey_wallpaper").value
    data_json.items[posArray].collision_type = document.getElementById("collision_type").value
    data_json.items[posArray].break_hits = document.getElementById("break_hits").value
    data_json.items[posArray].drop_chance = document.getElementById("drop_chance").value
    data_json.items[posArray].clothing_type = document.getElementById("clothing_type").value
    data_json.items[posArray].rarity = document.getElementById("rarity").value
    data_json.items[posArray].max_amount = document.getElementById("max_amount").value
    data_json.items[posArray].extra_file = document.getElementById("extra_file").value
    data_json.items[posArray].extra_file_hash = document.getElementById("extra_file_hash").value
    data_json.items[posArray].audio_volume = document.getElementById("audio_volume").value
    data_json.items[posArray].pet_name = document.getElementById("pet_name").value
    data_json.items[posArray].pet_prefix = document.getElementById("pet_prefix").value
    data_json.items[posArray].pet_suffix = document.getElementById("pet_suffix").value
    data_json.items[posArray].pet_ability = document.getElementById("pet_ability").value
    data_json.items[posArray].seed_base = document.getElementById("seed_base").value
    data_json.items[posArray].seed_overlay = document.getElementById("seed_overlay").value
    data_json.items[posArray].tree_base = document.getElementById("tree_base").value
    data_json.items[posArray].tree_leaves = document.getElementById("tree_leaves").value

    var to_arr = document.getElementById("seed_color").value.split(",")
    data_json.items[posArray].seed_color.a = to_arr[0]
    data_json.items[posArray].seed_color.r = to_arr[1]
    data_json.items[posArray].seed_color.g = to_arr[2]
    data_json.items[posArray].seed_color.b = to_arr[3]

    to_arr = document.getElementById("seed_overlay_color").value.split(",")
    data_json.items[posArray].seed_overlay_color.a = to_arr[0]
    data_json.items[posArray].seed_overlay_color.r = to_arr[1]
    data_json.items[posArray].seed_overlay_color.g = to_arr[2]
    data_json.items[posArray].seed_overlay_color.b = to_arr[3]

    data_json.items[posArray].grow_time = document.getElementById("grow_time").value
    data_json.items[posArray].val2 = document.getElementById("val2").value
    data_json.items[posArray].is_rayman = document.getElementById("is_rayman").value
    data_json.items[posArray].extra_options = document.getElementById("extra_options").value
    data_json.items[posArray].texture2 = document.getElementById("texture2").value
    data_json.items[posArray].extra_options2 = document.getElementById("extra_options2").value
    data_json.items[posArray].data_position_80 = document.getElementById("pos_80_data").value
    data_json.items[posArray].punch_options = document.getElementById("punch_options").value
    data_json.items[posArray].data_version_12 = document.getElementById("data_version_12").value
    data_json.items[posArray].int_version_13 = document.getElementById("int_version_13").value
    data_json.items[posArray].int_version_14 = document.getElementById("int_version_14").value
    data_json.items[posArray].data_version_15 = document.getElementById("data_version_15").value
    data_json.items[posArray].str_version_15 = document.getElementById("str_version_15").value
    $("#modal-editItems").modal("hide")
}
